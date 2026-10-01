const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  configSummary,
  validCfgName,
  steamLibraryPaths,
  isHubMessage,
} = require('../../dist/core/config-workspace');
const { parse } = require('../../dist/core/parser');
const { CommandRegistry } = require('../../dist/catalog/registry');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));

test('folder summaries share the effective model and preserve deferred/unknown execution', () => {
  const result = configSummary(
    parse('alias setup "bind q slot1"\nbind w +forward\nexec other\nbind e slot2'),
    registry,
  );
  assert.equal(result.binds, 2);
  assert.equal(result.aliases, 1);
  assert.equal(result.partial, true);
  assert.equal(configSummary(parse('bind q slot1\nunbindall'), registry).binds, 0);
  assert.equal(configSummary(parse('not_a_known_command'), registry).findings, 1);
});

test('CFG names cannot escape the selected folder or use Windows device names', () => {
  for (const name of ['autoexec.cfg', 'my config.cfg', 'Treino-ação.cfg', 'binds_2.CFG'])
    assert.equal(validCfgName(name), true, name);
  for (const name of [
    '../private.cfg',
    '..\\private.cfg',
    'C:\\foo.cfg',
    '/foo.cfg',
    'file.txt',
    '.cfg',
    'my..cfg',
    'CON.cfg',
    'nul.any.cfg',
    'COM1.cfg',
    'cfg:stream.cfg',
    'x.cfg\n',
    'x'.repeat(100) + '.cfg',
  ])
    assert.equal(validCfgName(name), false, name);
});

test('Steam detection reads multiple and legacy libraries without assuming a drive', () => {
  assert.deepEqual(
    steamLibraryPaths(
      '"libraryfolders" { "0" { "path" "C:\\\\Steam" } "1" { "path" "D:\\\\SteamLibrary" } "2" "/mnt/games" "apps" { "730" "12" } }',
    ),
    ['C:\\Steam', 'D:\\SteamLibrary', '/mnt/games'],
  );
  assert.deepEqual(steamLibraryPaths('"path" "relative" "path" "/games" "path" "/games"'), [
    '/games',
  ]);
});

test('hub messages permit known actions and host-owned snapshot IDs only', () => {
  for (const type of ['ready', 'choose', 'detect', 'refresh', 'disconnect', 'new', 'revealFolder'])
    assert.equal(isHubMessage({ type }), true);
  for (const type of ['open', 'bindMap', 'health'])
    assert.equal(isHubMessage({ type, revision: 1, file: 'autoexec.cfg' }), true);
  for (const value of [
    null,
    [],
    {},
    { type: 'exec' },
    { type: 'new', path: 'x.cfg' },
    { type: 'open', file: '../x.cfg', revision: 1 },
    { type: 'open', file: 'x.cfg', revision: 0 },
    { type: 'open', file: 'x.cfg', revision: 1.5 },
    { type: 'open', file: 'x.cfg', revision: 1, command: 'exec' },
  ])
    assert.equal(isHubMessage(value), false);
});
