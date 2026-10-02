const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CommandRegistry } = require('../../dist/catalog/registry');
const { humanMeaning } = require('../../dist/core/human-meaning');
const { documentation } = require('../../dist/core/documentation');
const { bindMapModel } = require('../../dist/core/bind-map');
const { parse } = require('../../dist/core/parser');
const { effectiveConfig } = require('../../dist/core/effective');
const {
  previewBinds,
  searchBindActions,
  assertFreshPreview,
  isBuilderMessage,
} = require('../../dist/core/bind-builder');
const { validateCatalog } = require('../../scripts/lib/validate-catalog.cjs');
const catalog = require('../../catalog/catalog.json');
const registry = new CommandRegistry(catalog);
const change = (key, command, replace = false, parameters = []) => ({
  key,
  action: { command, parameters },
  replace,
});

test('shared slot meanings, provenance, localization and original technical metadata', () => {
  const labels = [
    'Primary Weapon',
    'Secondary Weapon',
    'Knife / Melee',
    'Cycle Grenades',
    'C4 / Bomb',
    'HE Grenade',
    'Flashbang',
    'Smoke Grenade',
    'Decoy Grenade',
    'Molotov / Incendiary',
  ];
  labels.forEach((label, i) => {
    const entry = registry.get(`slot${i + 1}`);
    assert.equal(humanMeaning(entry, 'en').label, label);
    assert.ok(humanMeaning(entry, 'pt-BR').label);
    assert.equal(entry.provenance['editorial.meaning'].confidence, 'community');
    assert.equal(entry.runtime.verifiedInGame, false);
    assert.equal(entry.original?.text, entry.technical.description || undefined);
    assert.ok(documentation(entry, { language: 'en' }).some((b) => b.text === label));
  });
  assert.equal(humanMeaning(registry.get('slot13'), 'en').label, undefined);
  assert.equal(searchBindActions(registry, 'slot13', 'en')[0].label, 'slot13');
  assert.match(humanMeaning(registry.get('slot12'), 'en').description, /mode/);
  const source = 'bind "x" "slot8"';
  const data = bindMapModel(effectiveConfig(parse(source), registry), {
    registry,
    source,
    language: 'en',
  });
  assert.equal(data.entries[0].meaning, 'Smoke Grenade');
  assert.equal(data.entries[0].action, 'slot8');
});

test('action search matches technical and human vocabulary in both languages', () => {
  for (const [query, command] of [
    ['smoke', 'slot8'],
    ['slot8', 'slot8'],
    ['flash', 'slot7'],
    ['molotov', 'slot10'],
    ['incendiary', 'slot10'],
    ['primary', 'slot1'],
  ])
    assert.ok(
      searchBindActions(registry, query, 'en').some((a) => a.command === command),
      query,
    );
  assert.ok(searchBindActions(registry, 'fumaça', 'pt-BR').some((a) => a.command === 'slot8'));
});

test('localized edits preserve comments, quotes, unrelated text, CRLF and final newline', () => {
  for (const ending of ['', '\r\n']) {
    const source = '// personal\r\n  bind  "X"   "slot8" // keep\r\nsensitivity "1.4"' + ending;
    const p = previewBinds(
      source,
      [change('x', 'slot7', true), change('mouse4', 'slot10')],
      registry,
    );
    assert.deepEqual(p.errors, []);
    assert.equal(
      p.result,
      source.replace('"slot8"', '"slot7"') +
        (ending ? '' : '\r\n') +
        'bind "mouse4" "slot10"' +
        ending,
    );
    assert.equal(p.human[0].before, 'Smoke Grenade');
    assert.equal(p.human[0].after, 'Flashbang');
    assert.match(p.raw, /- bind/);
    assert.equal(parse(p.result).issues.length, 0);
    assertFreshPreview(p, source);
    assert.throws(() => assertFreshPreview(p, source + '\n// changed'), /stale/);
  }
  const unquoted = previewBinds(
    'bind x slot8; echo unchanged',
    [change('x', 'sensitivity', true, ['1.4'])],
    registry,
  );
  assert.equal(unquoted.result, 'bind x "sensitivity 1.4"; echo unchanged');
  assert.equal(previewBinds('', [change('w', '+forward')], registry).result, 'bind "w" "+forward"');
});

test('conflicts, malformed source, injection, availability and parameter constraints block application', () => {
  const cases = [
    ['bind x slot8', [change('x', 'slot7')], 'replace-required:x'],
    ['', [change('x', 'slot8'), change('X', 'slot7')], 'duplicate-key:x'],
    ['', [change('fakekey', 'slot8')], 'invalid-key:fakekey'],
    ['', [change('x', 'invented')], 'unavailable-command:invented'],
    ['', [change('x', 'slot8', false, [';exec'])], 'unsafe-action:x'],
    ['', [change('x', 'slot8', false, ['1'])], 'slot-arguments:x'],
    ['', [change('x', 'cl_crosshairsize', false, ['abc'])], 'invalid-parameter:x'],
    ['bind x "unfinished', [change('x', 'slot8')], 'malformed-or-large-source'],
    ['alias slot8 "slot7"', [change('x', 'slot8')], 'alias-shadow:slot8'],
    ['alias bind "echo shadow"', [change('x', 'slot8')], 'alias-shadow:bind'],
  ];
  for (const [source, changes, code] of cases) {
    const p = previewBinds(source, changes, registry);
    assert.ok(p.errors.includes(code), JSON.stringify(p.errors));
    assert.equal(p.result, source);
    assert.throws(() => assertFreshPreview(p, source));
  }
});

test('deferred alias writes stay preserved and external exec uncertainty remains explicit', () => {
  const source = 'alias setup "bind x slot8"\nsetup\nexec unresolved.cfg';
  const p = previewBinds(source, [change('x', 'slot7', true)], registry);
  assert.equal(p.result, source + '\nbind "x" "slot7"');
  assert.ok(p.warnings.includes('partial-source'));
  assert.ok(p.warnings.includes('append-override:x'));
});

test('semantic schema rejects missing translations, invalid evidence and promoted confidence', () => {
  for (const mutate of [
    (m) => (m.label.en = 42),
    (m) => delete m.label['pt-BR'],
    (m) => (m.confidence = 'verified'),
    (m) => (m.source = 'missing'),
    (m) => (m.strength = 'verified'),
  ]) {
    const copy = structuredClone(catalog);
    mutate(copy.entries.find((e) => e.name === 'slot8').editorial.meaning);
    assert.throws(() => validateCatalog(copy), /human meaning/);
  }
});

test('builder message boundary validates nested actions and rejects paths or unknown fields', () => {
  assert.ok(isBuilderMessage({ type: 'preview', changes: [change('x', 'slot8')] }));
  assert.ok(isBuilderMessage({ type: 'apply', snapshot: 1, acknowledge: true }));
  for (const m of [
    { type: 'apply', snapshot: 1, acknowledge: true, path: 'C:/game.cfg' },
    { type: 'preview', changes: [{ ...change('x', 'slot8'), extra: 1 }] },
    {
      type: 'preview',
      changes: [{ ...change('x', 'slot8'), action: { command: 'slot8', parameters: [1] } }],
    },
  ])
    assert.equal(isBuilderMessage(m), false);
});
