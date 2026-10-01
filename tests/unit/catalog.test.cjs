const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../../catalog/catalog.json');
const metadata = require('../../catalog/source/parameters.json');

test('reviewed parameters have pinned sources and bilingual value labels', () => {
  for (const [name, details] of Object.entries(metadata.commands)) {
    const entry = catalog.entries.find((entry) => entry.name === name);
    assert.ok(entry, name);
    assert.deepEqual(entry.parameter, details.parameter);
    const source = metadata.sources[details.sourceId];
    assert.match(source.revision, /^[a-f0-9]{40}$/);
    assert.ok(source.url.includes(source.revision));
    assert.equal(entry.documentationSource.snapshotDate, source.snapshotDate);
    for (const value of entry.parameter.values ?? []) {
      assert.ok(value.en && value['pt-BR']);
    }
  }
});

test('HUD colors and useful examples come from curated metadata rather than fixture values', () => {
  const hud = catalog.entries.find((entry) => entry.name === 'cl_hud_color');
  assert.equal(hud.parameter.values.find((value) => value.value === '2').en, 'Bright white');
  assert.ok(hud.parameter.values.some((value) => value.value === '12'));
  assert.equal(hud.parameter.default, '0');
  const offset = catalog.entries.find((entry) => entry.name === 'viewmodel_offset_x');
  assert.deepEqual(offset.documentationExamples[0].arguments, ['1']);
  assert.equal(offset.parameter.default, '1');
});
