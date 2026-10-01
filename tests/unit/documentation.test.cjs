const { test } = require('node:test');
const assert = require('node:assert/strict');
const { documentation } = require('../../dist/core/documentation');
const catalog = require('../../catalog/catalog.json');
const entry = (name) => catalog.entries.find((entry) => entry.name === name);
const fields = (blocks) =>
  Object.fromEntries(
    blocks.filter((block) => block.kind === 'field').map((block) => [block.label, block.value]),
  );

test('numeric hover separates the written value, reviewed default and bounds from observed data', () => {
  const blocks = documentation(entry('viewmodel_offset_x'), {
    language: 'en',
    currentArguments: ['2.5'],
  });
  const values = fields(blocks);
  assert.equal(values['Current value'], '2.5');
  assert.equal(values.Default, '1');
  assert.equal(values['Allowed range'], '-2 to 2.5');
  assert.equal(values.Kind, undefined);
  assert.ok(!JSON.stringify(blocks).includes('Snapshot value'));
  assert.ok(
    blocks.some(
      (block) => block.kind === 'link' && block.label === 'Source 2 metadata via SteamTracking',
    ),
  );
});
test('current and default enum/boolean values include translated meanings', () => {
  const outline = fields(
    documentation(entry('cl_crosshair_drawoutline'), { language: 'en', currentArguments: ['0'] }),
  );
  assert.equal(outline['Current value'], '0 — No outline');
  assert.equal(outline.Default, '1 — Full outline');
  const recoil = fields(
    documentation(entry('cl_crosshair_recoil'), { language: 'pt-BR', currentArguments: ['false'] }),
  );
  assert.equal(recoil['Valor atual'], 'false — Desativado');
  assert.equal(recoil['Padrão'], 'true — Ativado');
  assert.equal(
    fields(
      documentation(entry('cl_crosshair_recoil'), { language: 'en', currentArguments: ['0'] }),
    )['Current value'],
    '0 — Off',
  );
});
test('queries/completion do not invent current values and dump data is never promoted to a default', () => {
  const base = entry('viewmodel_offset_x');
  const unreviewed = { ...base, parameter: undefined };
  const values = fields(documentation(unreviewed, { language: 'en' }));
  assert.equal(values['Current value'], undefined);
  assert.equal(values.Default, undefined);
  assert.equal(values['Observed value'], base.technical.dumpValue);
  assert.equal(
    fields(documentation(base, { language: 'en', currentArguments: [] }))['Current value'],
    undefined,
  );
  assert.equal(
    fields(documentation(entry('bot_add_t'), { language: 'en', currentArguments: ['bob'] }))[
      'Current value'
    ],
    undefined,
  );
});
test('advanced details expose type/provenance and one-sided ranges remain explicit', () => {
  const base = entry('viewmodel_offset_x');
  const blocks = documentation(base, { language: 'en', advanced: true });
  assert.equal(fields(blocks).Kind, 'ConVar');
  assert.ok(blocks.some((block) => block.kind === 'heading' && block.text === 'Field provenance'));
  const oneSide = {
    ...base,
    parameter: undefined,
    technical: { ...base.technical, min: -2, max: undefined },
  };
  assert.equal(
    fields(documentation(oneSide, { language: 'pt-BR' }))['Intervalo permitido'],
    'Mínimo: -2',
  );
});
