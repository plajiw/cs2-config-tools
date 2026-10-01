const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../../dist/core/parser');
const { effectiveConfig } = require('../../dist/core/effective');
const { bindFindings } = require('../../dist/core/binds');
const { healthReport } = require('../../dist/core/health');
const { CommandRegistry } = require('../../dist/catalog/registry');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));
const model = (text) => effectiveConfig(parse(text), registry);

test('different and identical bind writes are distinct findings with previous source locations', () => {
  const text = 'bind q "slot1"\nbind q "slot2"\nbind q "slot2"';
  const state = model(text),
    findings = bindFindings(state);
  assert.deepEqual(
    findings.map((f) => f.code),
    ['bind-overwritten', 'bind-redundant'],
  );
  assert.equal(state.binds.get('q').value, 'slot2');
  assert.equal(text.slice(findings[0].start, findings[0].end), 'q');
  assert.equal(findings[0].related[0].start, text.indexOf('q'));
  assert.equal(findings[1].related[0].start, findings[0].start);
  const report = healthReport(parse(text), registry, state);
  assert.equal(report.counts.bindOverwrites, 1);
  assert.equal(report.counts.redundantBinds, 1);
});
test('unbind and unbindall break comparisons, while a bind query does not mutate state', () => {
  assert.equal(bindFindings(model('bind q slot1\nunbind q\nbind q slot2')).length, 0);
  assert.equal(
    bindFindings(model('bind q slot1\nbind w slot2\nunbindall\nbind q slot3\nbind w slot4')).length,
    0,
  );
  assert.equal(bindFindings(model('bind q slot1\nbind q\nbind q slot2')).length, 1);
  assert.equal(bindFindings(model('bind q slot1\nunbind w\nbind q slot2')).length, 1);
});
test('exec, unknown commands, cycles and invalid syntax do not manufacture certain conflicts', () => {
  for (const command of ['exec other', 'plugin_command', 'alias loop "loop"\nloop']) {
    const state = model(`bind q slot1\n${command}\nbind q slot2\nbind q slot3`);
    assert.equal(state.complete, false);
    assert.equal(bindFindings(state).length, 1, 'Only the last uninterrupted pair conflicts');
  }
  assert.equal(bindFindings(model('bind q slot1\nbind q "unfinished')).length, 0);
  const beforeUnknown = model('bind q slot1\nbind q slot2\nexec other');
  assert.equal(beforeUnknown.binds.get('q').certain, false);
  assert.equal(
    bindFindings(beforeUnknown).length,
    1,
    'Later uncertainty does not undo an observed earlier replacement',
  );
});
test('alias calls are compared in execution order and report invocation and definition locations', () => {
  const text = 'alias setup "bind q slot2"\nbind q slot1\nsetup\nsetup';
  const findings = bindFindings(model(text));
  assert.deepEqual(
    findings.map((f) => f.code),
    ['bind-overwritten', 'bind-redundant'],
  );
  assert.equal(findings[0].start, text.indexOf('\nsetup') + 1);
  assert.equal(findings[1].related[0].start, findings[0].start);
  assert.equal(findings[0].related[1].role, 'bind-definition');
  assert.equal(text.slice(findings[0].related[1].start, findings[0].related[1].end), 'q');
  assert.equal(bindFindings(model('bind q slot1\nalias setup "bind q slot2"')).length, 0);
  assert.equal(
    bindFindings(model('bind F2 "bind q slot1; bind q slot2"')).length,
    0,
    'Deferred keypress bodies are not executed',
  );
  assert.equal(
    bindFindings(model('bind q slot1\nalias clear "unbindall"\nclear\nbind q slot2')).length,
    0,
  );
});
test('nested aliases, budgets and literal keys preserve analysis boundaries', () => {
  const text = 'alias setup "bind q slot2"\nalias outer "setup"\nbind q slot1\nouter';
  const findings = bindFindings(model(text));
  assert.equal(findings[0].start, text.lastIndexOf('outer'));
  assert.equal(
    bindFindings(effectiveConfig(parse('bind q slot1\nbind q slot2'), registry, 1)).length,
    0,
  );
  assert.equal(
    bindFindings(model('bind q slot1\nbind Q slot2')).length,
    0,
    'No unverified case normalization',
  );
});
