const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateCatalog } = require('../../scripts/lib/validate-catalog.cjs');
const { documentation } = require('../../dist/core/documentation');
const { parameterBounds, parameterMeaning } = require('../../dist/catalog/registry');
const catalog = require('../../catalog/catalog.json');
const sample = () => {
  const copy = structuredClone(catalog),
    entry = copy.entries.find((e) => e.name === 'cl_crosshair_drawoutline');
  entry.technical.min = 0;
  entry.technical.max = 10;
  entry.parameter = { type: 'integer', min: 1, max: 9, default: '2' };
  return { copy, entry };
};
test('applicable constraints reject contradictions while preserving reviewed subsets', () => {
  for (const parameter of [
    { type: 'number', min: -2, max: -1, default: '-1' },
    { type: 'integer', default: '11' },
    { type: 'integer', values: [{ value: '11', en: 'Eleven', 'pt-BR': 'Onze' }] },
    { type: 'integer', min: 1, max: 9, default: '0' },
    { type: 'integer', default: '1.5' },
    { type: 'integer', min: 9, max: 1 },
  ]) {
    const { copy, entry } = sample();
    entry.parameter = parameter;
    assert.throws(() => validateCatalog(copy), /constraints|default|range|enum/);
  }
  const { copy, entry } = sample();
  assert.equal(validateCatalog(copy), copy);
  assert.deepEqual(
    parameterBounds(entry),
    { min: 1, max: 9 },
    'All consumers retain the supported subset',
  );
  entry.technical.values = ['1', '2'];
  entry.provenance['technical.values'] = {
    source: entry.technical.sourceId,
    confidence: 'snapshot-verified',
  };
  entry.parameter.values = [{ value: '3', en: 'Three', 'pt-BR': 'Três' }];
  entry.parameter.default = '3';
  assert.throws(() => validateCatalog(copy), /constraints/, 'Conflicting reviewed enum fails');
  entry.parameter.values = [{ value: '2', en: 'Two', 'pt-BR': 'Dois' }];
  entry.parameter.default = '2';
  validateCatalog(copy);
});
test('explicit reviewed build differences are stored but not mixed with snapshot facts', () => {
  const { copy, entry } = sample();
  entry.runtime.gameBuild = 'reference-build';
  copy.sources['other-build'] = { buildId: 'other-build' };
  entry.parameter = {
    type: 'integer',
    min: 20,
    max: 30,
    default: '22',
    scope: { buildId: 'other-build', source: 'other-build', reviewed: true },
    values: [{ value: '22', en: 'Other', 'pt-BR': 'Outro' }],
  };
  validateCatalog(copy);
  assert.deepEqual(parameterBounds(entry), { min: 0, max: 10 });
  assert.equal(parameterMeaning(entry, '22', 'en'), undefined);
  assert.ok(!documentation(entry, { language: 'en' }).some((b) => b.label === 'Default'));
  entry.parameter.scope.reviewed = false;
  assert.throws(() => validateCatalog(copy), /scope/);
  entry.parameter.scope.reviewed = true;
  entry.parameter.scope.buildId = 'reference-build';
  copy.sources['other-build'].buildId = 'reference-build';
  assert.throws(() => validateCatalog(copy), /constraints/, 'Same-build conflict still fails');
});
