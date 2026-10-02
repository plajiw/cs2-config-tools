const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../../dist/core/parser');
const { effectiveConfig } = require('../../dist/core/effective');
const { parameterFindings } = require('../../dist/core/parameters');
const { analyze } = require('../../dist/core/diagnostics');
const { healthReport } = require('../../dist/core/health');
const { aliasInterpretation } = require('../../dist/core/ordered-aliases');
const { CommandRegistry } = require('../../dist/catalog/registry');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));
const findings = (parsed, state) =>
  analyze(parsed, new Set(registry.entries.keys()), false, new Map(), state.aliasResolution);

test('ordered alias facts preserve before/after shadowing, queries and redefinition', () => {
  const parsed = parse('cl_hud_color 99\nalias cl_hud_color "echo hi"\ncl_hud_color 99');
  const state = effectiveConfig(parsed, registry);
  assert.deepEqual(
    parameterFindings(parsed, registry, state.aliasResolution).map((f) => f.start),
    [13],
  );
  assert.equal(aliasInterpretation(state.aliasResolution, parsed.statements[0]), 'native');
  const aliases = parse(
    'alias named "sensitivity 1"\nnamed\nalias named "sensitivity 2"\nnamed\nalias named',
  );
  const resolved = effectiveConfig(aliases, registry);
  assert.equal(resolved.assignments.get('sensitivity').value, '2');
  assert.equal(
    resolved.history.filter((e) => e.kind === 'alias').length,
    2,
    'Query is not a definition',
  );
  assert.equal(findings(aliases, resolved).filter((f) => f.code === 'unknown').length, 0);
});

test('aliases created by invoked aliases are shared facts; deferred uses never execute', () => {
  const parsed = parse(
    'alias create "alias later echo"\ncreate\nlater\nbind x "later"\nbind y "alias dormant echo"',
  );
  const state = effectiveConfig(parsed, registry);
  assert.equal(state.complete, true);
  assert.equal(state.aliases.has('later'), true);
  assert.equal(state.aliases.has('dormant'), false);
  assert.deepEqual(
    findings(parsed, state).filter((f) => f.code === 'unknown'),
    [],
  );
  assert.deepEqual(
    healthReport(parsed, registry, state).findings.filter((f) => f.code === 'unknown'),
    [],
  );
  const deferred = parse('bind x "future"\nalias future "echo hi"');
  assert.equal(
    aliasInterpretation(
      effectiveConfig(deferred, registry).aliasResolution,
      deferred.statements[1],
    ),
    'uncertain',
  );
});

test('cycle and expansion-limit facts agree across diagnostics, health and effective state', () => {
  const parsed = parse('alias loop "loop"\nloop');
  const state = effectiveConfig(parsed, registry);
  assert.ok(state.limits.some((l) => l.code === 'alias-cycle'));
  const diagnostics = findings(parsed, state).filter((f) => f.code === 'alias-cycle');
  assert.equal(diagnostics.length, 1);
  assert.deepEqual(
    healthReport(parsed, registry, state).findings.filter((f) => f.code === 'alias-cycle'),
    diagnostics,
  );
  const budget = effectiveConfig(parse('alias a "echo hi"\na\na'), registry, 2);
  assert.ok(budget.limits.some((l) => l.code === 'budget'));
  assert.equal(budget.complete, false);
});
