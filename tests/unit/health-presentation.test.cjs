const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../../dist/core/parser');
const { healthReport } = require('../../dist/core/health');
const { healthReportText } = require('../../dist/core/health-presentation');
const { findingMessage } = require('../../dist/core/finding-message');
const { CommandRegistry } = require('../../dist/catalog/registry');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));

test('health text groups findings, preserves severity and related bind locations across CRLF', () => {
  const source = 'bind q "slot1"\r\nbind q "slot2"\r\nbind q "slot2"\r\nnot_in_catalog';
  const report = healthReport(parse(source), registry);
  const text = healthReportText(report, source, 'test.cfg', 'en');
  assert.match(text, /Findings: 3 · 0 errors · 0 warnings · 3 informational/);
  assert.match(text, /Repeated bindings \(1\)[\s\S]*L3 \[Info\] q/);
  assert.match(text, /Replaced bindings \(1\)[\s\S]*L2 \[Info\] q/);
  assert.match(text, /Previous binding: L1/);
  assert.match(text, /Previous binding: L2/);
  assert.match(text, /L4 not_in_catalog\n\s+The analyzer cannot determine this effect/);
  assert.match(text, /Partial analysis/);
  assert.doesNotMatch(text, /bind-redundant|bind-overwritten|: dynamic/);
});

test('health text explains selected evidence without claiming removal or equivalent replacements', () => {
  const source = 'cl_crosshairgap 2';
  const report = healthReport(parse(source), registry, undefined, new Set(['cl_crosshairgap']));
  const text = healthReportText(report, source, 'test.cfg', 'pt-BR');
  assert.match(text, /Requer revisão — relato de console selecionado/);
  assert.match(text, /build não identificada/);
  assert.match(text, /não há substituição automática/);
  assert.match(text, /\[Aviso\] cl_crosshairgap/);
  assert.doesNotMatch(text, /reported-rejection/);
});

test('health text distinguishes empty findings from partial analysis and explains each limit', () => {
  const source = 'exec other.cfg';
  const report = healthReport(parse(source), registry);
  assert.equal(report.findings.length, 0);
  const text = healthReportText(report, source, 'test.cfg', 'en');
  assert.match(text, /No findings from these checks/);
  assert.match(text, /Partial analysis/);
  assert.match(text, /inspect the exec target separately/);
  const descriptions = {
    syntax: /Malformed text/,
    dynamic: /cannot determine this effect/,
    'alias-cycle': /recursion limit/,
    budget: /operation limit/,
  };
  for (const [code, pattern] of Object.entries(descriptions)) {
    report.state.limits = [{ code }];
    assert.match(healthReportText(report, source, 'test.cfg', 'en'), pattern);
  }
});

test('health text retains syntax errors and reports empty complete files without game certification', () => {
  const bad = 'bind "unfinished';
  const text = healthReportText(healthReport(parse(bad), registry), bad, 'test.cfg', 'en');
  assert.match(text, /1 errors/);
  assert.match(text, /L1 \[Error\]/);
  assert.match(text, /Unterminated quoted string/);
  const empty = healthReportText(healthReport(parse(''), registry), '', 'empty.cfg', 'pt-BR');
  assert.match(empty, /Nenhum achado nestas verificações/);
  assert.match(empty, /Sem efeitos não resolvidos no subconjunto modelado/);
  assert.match(empty, /Nenhum comando executado/);
});

test('health presentation keeps alias definition origins and literal text on a single report line', () => {
  const source = 'bind q "slot1"\nalias change "bind q slot2"\nchange';
  const report = healthReport(parse(source), registry);
  const text = healthReportText(report, source, 'file\nSUMMARY\x1b.cfg', 'en');
  assert.match(text, /L3 \[Info\] q/);
  assert.match(text, /Binding defined in alias: L2/);
  assert.match(text, /Previous binding: L1/);
  assert.match(text, /file SUMMARY .cfg/);
  assert.equal(findingMessage({ code: 'new-code' }, 'en'), 'Finding requires review.');
});
