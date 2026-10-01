const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bindMapModel, isBindMapMessage } = require('../../dist/core/bind-map');
const { parse } = require('../../dist/core/parser');
const { effectiveConfig } = require('../../dist/core/effective');
const { CommandRegistry } = require('../../dist/catalog/registry');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));
const model = (text) => bindMapModel(effectiveConfig(parse(text), registry));

test('bind map preserves every literal key and deferred action without executing it', () => {
  const data = model('bind q "slot1; slot2"\nbind Q custom\nbind mouse4 +jump\nbind kp_home slot3');
  assert.deepEqual(
    data.entries.map((entry) => entry.key),
    ['q', 'Q', 'mouse4', 'kp_home'],
  );
  assert.equal(data.entries[0].action, 'slot1; slot2');
  assert.equal(data.partial, false);
  assert.ok(data.entries.every((entry) => entry.certain));
});
test('bind map reflects resets, replacement history and alias invocation origins', () => {
  const text = 'bind q slot1\nalias setup "bind q slot2"\nsetup\nsetup\nunbind mouse4';
  const data = model(text);
  assert.equal(data.entries.length, 1);
  assert.equal(data.entries[0].action, 'slot2');
  assert.equal(data.entries[0].origin.start, text.lastIndexOf('setup'));
  assert.equal(data.entries[0].definition.start, text.indexOf('bind q slot2'));
  assert.deepEqual(
    data.entries[0].changes.map((change) => change.kind),
    ['overwritten', 'redundant'],
  );
  assert.equal(model('bind q slot1\nunbindall').entries.length, 0);
  assert.equal(model('bind q slot1\nunbind q').entries.length, 0);
});
test('partial and per-bind uncertainty survive projection; later literal writes remain distinct', () => {
  const data = model('bind q slot1\nexec other\nbind w slot2');
  assert.equal(data.partial, true);
  assert.equal(data.entries[0].certain, false);
  assert.equal(data.entries[1].certain, true);
  assert.deepEqual(data.limits, [{ code: 'exec', name: 'exec' }]);
  assert.equal(model('bind q "unfinished').partial, true);
  assert.equal(model('bind q "unfinished').entries.length, 0);
});
test('webview protocol rejects paths, offsets, invalid IDs and arbitrary message shapes', () => {
  assert.equal(isBindMapMessage({ type: 'ready' }), true);
  for (const target of ['origin', 'definition', 0, 'history:0'])
    assert.equal(
      isBindMapMessage({ type: 'reveal', snapshot: 1, version: 1, entry: 0, target }),
      true,
    );
  for (const message of [
    { type: 'reveal', version: 1, entry: 0, target: 'origin' },
    { type: 'reveal', snapshot: 0, version: 1, entry: 0, target: 'origin' },
    null,
    [],
    { type: 'ready', command: 'exec' },
    { type: 'command' },
    { type: 'reveal', snapshot: 1, version: 1, entry: -1, target: 'origin' },
    { type: 'reveal', snapshot: 1, version: 1, entry: 0, target: -1 },
    { type: 'reveal', snapshot: 1, version: NaN, entry: 0, target: 'origin' },
    { type: 'reveal', snapshot: 1, version: 1, entry: 0, target: '../private.cfg' },
    { type: 'reveal', snapshot: 1, version: 1, entry: 0, target: 'history:-1' },
    { type: 'reveal', snapshot: 1, version: 1, entry: 0, target: 'history:1.5' },
    { type: 'reveal', snapshot: 1, version: 1, entry: 0, target: 'origin', start: 0 },
  ])
    assert.equal(isBindMapMessage(message), false);
});

test('bind presentation uses registry meaning, source lines and history without executing bodies', () => {
  const source = 'bind q slot1\nbind q slot2\nbind q slot2\nbind w "+jump; +duck"';
  const data = bindMapModel(effectiveConfig(parse(source), registry), {
    registry,
    source,
    language: 'pt-BR',
  });
  assert.equal(data.mode, 'read');
  assert.equal(data.entries[0].category, 'weapons');
  assert.equal(data.entries[0].meaning, registry.get('slot2').editorial['pt-BR']);
  assert.equal(data.entries[0].origin.line, 3);
  assert.equal(data.entries[0].raw, 'bind q slot2');
  assert.equal(data.entries[0].conflict, true);
  assert.deepEqual(
    data.entries[0].history.map((event) => event.effective),
    [false, false, true],
  );
  assert.equal(data.entries[1].category, 'custom');
  assert.equal(data.entries[1].action, '+jump; +duck');
  assert.equal(
    model('bind q slot1\nbind q slot2\nunbindall\nbind q slot3').entries[0].conflict,
    false,
  );
  assert.equal(
    model('bind q slot1\nbind q slot2\nunbind q\nbind q slot3').entries[0].conflict,
    false,
  );
});
