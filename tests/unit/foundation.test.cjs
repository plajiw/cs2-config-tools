const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateCatalog, validateParameter } = require('../../scripts/lib/validate-catalog.cjs');
const { parse, aliases } = require('../../dist/core/parser');
const { aliasAt } = require('../../dist/core/parser');
const { closestSymbols } = require('../../dist/core/suggestions');
const { healthReport } = require('../../dist/core/health');
const { analyze } = require('../../dist/core/diagnostics');
const { documentation } = require('../../dist/core/documentation');
const { effectiveConfig } = require('../../dist/core/effective');
const { parameterFindings } = require('../../dist/core/parameters');
const { CommandRegistry } = require('../../dist/catalog/registry');
const catalog = require('../../catalog/catalog.json');
const registry = new CommandRegistry(catalog);

test('catalog validation rejects invalid defaults, enums, evidence and compatibility chains', () => {
  assert.equal(validateCatalog(catalog), catalog);
  for (const parameter of [
    { type: 'number', min: 2, max: 1 },
    { type: 'integer', default: '1.5' },
    { type: 'number', default: 'NaN' },
    { type: 'boolean', default: '2' },
    {
      type: 'integer',
      values: [
        { value: '1', en: 'One', 'pt-BR': 'Um' },
        { value: '1', en: 'One', 'pt-BR': 'Um' },
      ],
    },
    { type: 'integer', min: 1, default: '0' },
  ])
    assert.throws(() => validateParameter('example', parameter));
  const entry = catalog.entries.find((e) => e.compatibility);
  for (const change of [
    { compatibility: { replacement: 'missing' } },
    { compatibility: { replacement: entry.name } },
    { provenance: { kind: { source: 'missing', confidence: 'snapshot-verified' } } },
  ]) {
    const bad = {
      ...catalog,
      entries: catalog.entries.map((e) => (e === entry ? { ...e, ...change } : e)),
    };
    assert.throws(() => validateCatalog(bad));
  }
});
test('parser retains source trivia and links deferred bodies without declaring their aliases', () => {
  const text = '// heading\r\nbind F2 "alias later echo; later"; sensitivity 1.5 // trailing';
  const parsed = parse(text);
  assert.equal(parsed.source, text);
  assert.ok(
    parsed.trivia.some((t) => t.kind === 'comment' && text.slice(t.start, t.end).startsWith('//')),
  );
  const parent = parsed.statements.find((s) => s.tokens[0].value === 'bind');
  assert.ok(
    parsed.statements
      .filter((s) => s.context === 'bind')
      .every((s) => s.parentStart === parent.start),
  );
  assert.equal(aliases(parsed).has('later'), false);
  const findings = analyze(
    parse('later\nalias later "echo hi"\nlater'),
    new Set(registry.entries.keys()),
    false,
  );
  assert.deepEqual(
    findings.filter((f) => f.code === 'unknown').map((f) => f.start),
    [0],
  );
});
test('documentation is localized outside the editor and does not repeat current or corpus examples', () => {
  const entry = registry.get('viewmodel_offset_x');
  const blocks = documentation(entry, {
    language: 'en',
    currentArguments: entry.documentationExamples[0].arguments,
  });
  assert.equal(blocks.filter((b) => b.kind === 'code').length, 1);
  assert.ok(
    blocks.some((b) => b.kind === 'field' && b.label === 'Current value' && b.value === '1'),
  );
  assert.ok(
    documentation(registry.get('cl_hud_color'), { language: 'pt-BR' })
      .find((b) => b.kind === 'values')
      .rows.some((r) => r.meaning === 'Branco intenso'),
  );
  const observedOnly = { ...entry, documentationExamples: undefined, examples: [['141']] };
  assert.equal(
    documentation(observedOnly, { language: 'en' }).filter((b) => b.kind === 'code').length,
    1,
  );
});
test('effective state preserves order, bind resets, history and deferred aliases', () => {
  const state = effectiveConfig(
    parse(
      'alias set "sensitivity 2"\nbind F2 "sensitivity 8"\nsensitivity 1\nset\nunbindall\nbind F3 "echo hi"',
    ),
    registry,
  );
  assert.equal(state.assignments.get('sensitivity').value, '2');
  assert.equal(state.assignments.get('sensitivity').certain, true);
  assert.equal(state.binds.has('F2'), false);
  assert.equal(state.binds.get('F3').value, 'echo hi');
  assert.equal(state.history.filter((e) => e.kind === 'assignment').length, 2);
  assert.equal(state.complete, true);
  assert.equal(
    effectiveConfig(parse('bind F2 "alias nested echo"'), registry).aliases.has('nested'),
    false,
  );
  const ordered = effectiveConfig(parse('set\nalias set "sensitivity 3"'), registry);
  assert.equal(ordered.assignments.has('sensitivity'), false);
  assert.equal(ordered.complete, false);
});
test('cycles, unresolved exec, invalid assignments and budgets produce partial results', () => {
  const cycle = effectiveConfig(parse('alias loop "loop"\nloop'), registry);
  assert.ok(cycle.limits.some((l) => l.code === 'alias-cycle'));
  const state = effectiveConfig(parse('sensitivity 1\nexec other\nsensitivity 2'), registry);
  assert.equal(state.complete, false);
  assert.equal(
    state.assignments.get('sensitivity').certain,
    true,
    'Explicit later write supersedes uncertain prior state',
  );
  assert.equal(
    effectiveConfig(parse('sensitivity 1\nexec other'), registry).assignments.get('sensitivity')
      .certain,
    false,
  );
  assert.equal(
    effectiveConfig(parse('cl_hud_color 99'), registry).assignments.get('cl_hud_color').certain,
    false,
  );
  assert.ok(
    effectiveConfig(parse('echo 1\necho 2'), registry, 1).limits.some((l) => l.code === 'budget'),
  );
});
test('parameter checks distinguish queries, literal types, reviewed choices and snapshot bounds', () => {
  assert.equal(
    parameterFindings(
      parse('cl_crosshair_recoil true\ncl_crosshair_recoil false\ncl_crosshair_recoil 1'),
      registry,
    ).length,
    0,
  );
  const findings = parameterFindings(
    parse(
      'cl_hud_color 99\nviewmodel_offset_x nope\ncl_crosshair_length 256\ncl_hud_color\necho 256',
    ),
    registry,
  );
  assert.deepEqual(
    findings.map((f) => f.code),
    ['parameter-value', 'parameter-type', 'parameter-range'],
  );
  assert.equal(
    parameterFindings(
      parse('cl_hud_color 2\nviewmodel_offset_x 1\ncl_crosshair_length 8'),
      registry,
    ).length,
    0,
  );
});

test('alias navigation distinguishes redefinitions and typo edits stay bounded', () => {
  assert.equal(aliases(parse('alias query')).has('query'), false);
  assert.equal(aliasAt(parse('alias query'), 'query', 20), undefined);
  const parsed = parse('alias named "echo first"\nnamed\nalias named "echo last"\nnamed');
  const calls = parsed.statements.filter((s) => s.tokens[0].value === 'named');
  assert.equal(aliasAt(parsed, 'named', calls[0].start).body, 'echo first');
  assert.equal(aliasAt(parsed, 'named', calls[1].start).body, 'echo last');
  assert.ok(closestSymbols('bot_ad_t', registry).includes('bot_add_t'));
  assert.deepEqual(closestSymbols('bot_add_t', registry), []);
  assert.deepEqual(closestSymbols('a', registry), []);
  assert.equal(registry.valueLabel('cl_hud_color', '2', 'pt-BR'), 'Branco intenso');
  assert.equal(registry.valueLabel('cl_hud_color', '999', 'en'), undefined);
});
test('health reports use the shared findings/state and do not pretend to resolve exec', () => {
  const parsed = parse('bind F2 "echo hi"\nsensitivity 1\nexec other\ncl_hud_color 99');
  const report = healthReport(parsed, registry);
  assert.equal(report.counts.statements, 4);
  assert.equal(report.counts.binds, 1);
  assert.equal(report.state.complete, false);
  assert.ok(report.state.limits.some((limit) => limit.code === 'exec'));
  assert.ok(report.findings.some((finding) => finding.code === 'parameter-value'));
  assert.equal(report.counts.certainAssignments, 0);
});
