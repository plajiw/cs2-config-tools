const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../../catalog/catalog.json');
const { parse } = require('../../dist/core/parser');
const { analyze } = require('../../dist/core/diagnostics');
const byName = new Map(catalog.entries.map((entry) => [entry.name, entry]));
const compatibility = new Map(
  catalog.entries
    .filter((entry) => entry.compatibility)
    .map((entry) => [entry.name, entry.compatibility.replacement]),
);

test('current crosshair dimensions have sourced limits and defaults', () => {
  for (const [name, min, max] of [
    ['cl_crosshair_length', 0, 255],
    ['cl_crosshair_thickness', 0, 32],
    ['cl_crosshair_gap', -3840, 3840],
  ]) {
    const entry = byName.get(name);
    assert.ok(entry);
    assert.equal(entry.parameter.min, min);
    assert.equal(entry.parameter.max, max);
    assert.equal(entry.documentationSource.snapshotDate, '2026-09-30');
  }
  assert.equal(
    byName.get('cl_crosshairstyle').parameter.values.find((value) => value.value === '9').en,
    'Static quad',
  );
  assert.equal(byName.get('cl_crosshairstyle').parameter.default, '7');
  assert.equal(
    byName.get('cl_crosshair_drawoutline').parameter.values.find((value) => value.value === '2').en,
    'Half outline',
  );
});

test('hidden settings are informational and do not claim equivalent values or removal', () => {
  const parsed = parse('cl_crosshairsize 2\ncl_crosshairthickness 1\ncl_crosshairalpha 255');
  const findings = analyze(parsed, new Set(byName.keys()), false, compatibility);
  assert.equal(findings.length, 3);
  assert.ok(
    findings.every(
      (finding) => finding.code === 'hidden-compatibility' && finding.severity === 'information',
    ),
  );
  assert.equal(findings[0].replacement, 'cl_crosshair_length');
  assert.equal(
    analyze(
      parse('alias cl_crosshairsize "echo hi"\ncl_crosshairsize'),
      new Set(byName.keys()),
      false,
      compatibility,
    ).length,
    0,
  );
});

test('color, outline and scope channels are covered in both languages', () => {
  for (const prefix of ['cl_crosshaircolor', 'cl_crosshairoutline'])
    for (const channel of ['r', 'g', 'b', 'a']) {
      const entry = byName.get(prefix + '_' + channel);
      assert.equal(entry.parameter.max, 255);
      assert.ok(entry.editorial['pt-BR']);
    }
  assert.equal(byName.get('cl_ironsight_usecrosshaircolor').parameter.type, 'boolean');
});
