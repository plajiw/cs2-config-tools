const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDump,
  validateSnapshot,
  diffSnapshots,
  reportMarkdown,
  sha256,
} = require('../../scripts/lib/source2.cjs');
const { attachTechnical } = require('../../scripts/lib/catalog-technical.cjs');
const { CommandRegistry } = require('../../dist/catalog/registry');
const revision = 'a'.repeat(40);
const snapshot = (entries) => ({
  schemaVersion: 1,
  repository: 'SteamTracking/GameTracking-CS2',
  revision,
  gameBuild: null,
  entries,
  sources: Object.fromEntries(
    ['convar', 'command'].map((kind) => {
      const path = `DumpSource2/${kind === 'convar' ? 'convars' : 'commands'}.txt`;
      return [
        kind,
        {
          path,
          sha256: sha256(kind),
          url: `https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/${revision}/${path}`,
        },
      ];
    }),
  ),
});
test('full dump parser retains literal values, bounds, flags, enums and multiline help', () => {
  const entries = parseDump(
    'example "a b (c)" (min: -1, max: 10, clientdll archive)\r\n\tHelp.\r\n\tSecond line.\r\nempty "" (enum: Example_t, hidden)\r\n\t<no description>',
    'convar',
  );
  assert.equal(entries[0].dumpValue, '"a b (c)"');
  assert.deepEqual(entries[0].flags, ['clientdll', 'archive']);
  assert.equal(entries[0].min, -1);
  assert.equal(entries[0].description, 'Help.\nSecond line.');
  assert.equal(entries[1].description, null);
  assert.equal(entries[1].enumName, 'Example_t');
  assert.equal(entries[1].dumpValue, '""');
  assert.deepEqual(parseDump('bind (release)\n\tBind a key.', 'command')[0], {
    name: 'bind',
    kind: 'command',
    flags: ['release'],
    description: 'Bind a key.',
  });
});
test('format drift, malformed bounds and duplicate symbols fail instead of producing missing commands', () => {
  for (const text of [
    'broken format',
    'a 1 (min: NaN)',
    'a 1 (min: 5, max: 1)',
    'a 1 ()\na 2 ()',
    '\thelp',
  ])
    assert.throws(() => parseDump(text, 'convar'));
  assert.throws(() => parseDump('bind 1 (release)', 'command'));
  assert.throws(() => parseDump('', 'command'));
});
test('snapshot validation requires both pinned files and unique cross-kind symbols', () => {
  const entries = parseDump('a 1 (release)', 'convar');
  const valid = snapshot(entries);
  assert.equal(validateSnapshot(valid), valid);
  assert.throws(() => validateSnapshot({ ...valid, sources: { convar: valid.sources.convar } }));
  const wrong = structuredClone(valid);
  wrong.sources.command.url = wrong.sources.command.url.replace(revision, 'master');
  assert.throws(() => validateSnapshot(wrong));
  assert.throws(() => validateSnapshot(snapshot([...entries, { ...entries[0], kind: 'command' }])));
});
test('diff reports absence separately from removal and compares values/help/flags', () => {
  const before = snapshot(parseDump('a 1 (release)\n\tOld\nb 0 (hidden)', 'convar'));
  const after = snapshot([
    ...parseDump('a 2 (archive)\n\tNew', 'convar'),
    ...parseDump('bind (release)', 'command'),
  ]);
  const diff = diffSnapshots(before, after);
  assert.equal(diff.added[0].name, 'bind');
  assert.equal(diff.missing[0].name, 'b');
  assert.deepEqual(diff.changed[0].fields.dumpValue, { before: '1', after: '2' });
  assert.ok(diff.changed[0].fields.flags && diff.changed[0].fields.description);
  assert.match(reportMarkdown(diff), /not removed/);
  assert.equal(diffSnapshots(after, after).changed.length, 0);
});
test('technical evidence does not replace human descriptions or older reviewed defaults', () => {
  const technical = parseDump('a 8 (min: 0, max: 10, cheat)\n\tOriginal help', 'convar')[0];
  const entry = attachTechnical(
    {
      name: 'a',
      original: null,
      editorial: { en: 'Community explanation' },
      parameter: { type: 'integer', default: '6' },
      documentationSource: { url: 'https://example.org/revision' },
    },
    technical,
    snapshot([technical]),
  );
  assert.equal(entry.parameter.default, '6');
  assert.equal(entry.technical.dumpValue, '8');
  assert.equal(entry.original.text, 'Original help');
  assert.equal(entry.catalogStatus, 'curated');
  assert.equal(entry.provenance['parameter.default'].confidence, 'community');
  assert.equal(entry.provenance['technical.dumpValue'].confidence, 'snapshot-verified');
  assert.equal(entry.runtime.gameBuild, null);
  assert.equal(entry.runtime.verifiedInGame, false);
});
test('normal suggestions filter explicit internal flags while recognition remains complete', () => {
  const entries = [
    { name: 'bind', kind: 'command', rawFlags: ['release'] },
    { name: 'hidden', kind: 'convar', rawFlags: ['hidden'] },
    { name: 'dev', kind: 'command', rawFlags: ['developmentonly'] },
    { name: 'setting', kind: 'convar', rawFlags: ['archive'] },
  ];
  const registry = new CommandRegistry({ entries });
  assert.ok(registry.get('hidden'));
  assert.deepEqual(
    registry.suggestions().map((e) => e.name),
    ['bind', 'setting'],
  );
  assert.equal(registry.suggestions('advanced').length, entries.length);
  assert.deepEqual(
    registry.suggestions('normal', true).map((e) => e.name),
    ['setting'],
  );
  assert.throws(() => new CommandRegistry({ entries: [entries[0], entries[0]] }));
});

test('promoted catalog covers commands and convars without claiming in-game verification', () => {
  const catalog = require('../../catalog/catalog.json');
  const registry = new CommandRegistry(catalog);
  for (const name of ['bind', 'exec', 'alias', 'toggle', 'bot_kick'])
    assert.equal(registry.get(name).kind, 'command');
  assert.equal(registry.get('cl_radar_scale').kind, 'convar');
  for (const entry of catalog.entries.filter((e) => e.technical)) {
    assert.equal(entry.runtime.verifiedInGame, false);
    assert.equal(entry.runtime.gameBuild, null);
    assert.ok(catalog.sources[entry.technical.sourceId]);
    assert.equal(entry.lifecycle, 'unknown');
  }
  const uncurated = catalog.entries.find((e) => e.catalogStatus === 'verified' && !e.original);
  assert.ok(uncurated);
  assert.equal(uncurated.documentation.reviewed, false);
});
