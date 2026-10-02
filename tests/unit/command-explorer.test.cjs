const { test } = require('node:test');
const assert = require('node:assert/strict');
const { searchCommands } = require('../../dist/core/command-explorer');
const { configSummary, isHubMessage } = require('../../dist/core/config-workspace');
const { parse } = require('../../dist/core/parser');
const { CommandRegistry } = require('../../dist/catalog/registry');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));

test('explorer searches shared names and localized descriptions with exact matches first', () => {
  assert.equal(searchCommands(registry, 'cl_radar_scale', false)[0].name, 'cl_radar_scale');
  assert.ok(
    searchCommands(registry, 'mira', true, 'advanced').some((item) =>
      item.name.startsWith('cl_crosshair'),
    ),
  );
  assert.deepEqual(searchCommands(registry, 'no_such_catalog_symbol_1234', false), []);
  assert.equal(searchCommands(registry, '', false, 'normal', 3).length, 3);
  assert.deepEqual(
    searchCommands(registry, 'radar', false),
    searchCommands(registry, ' RADAR ', false),
  );
});
test('explorer honors the existing shared normal/advanced visibility policy', () => {
  const hidden = registry.catalog.entries.find((entry) =>
    (entry.rawFlags || []).includes('hidden'),
  );
  assert.ok(hidden);
  assert.equal(
    searchCommands(registry, hidden.name, false).some((item) => item.name === hidden.name),
    false,
  );
  assert.equal(searchCommands(registry, hidden.name, false, 'advanced')[0].name, hidden.name);
});
test('hub summaries separate actual severities and CFG-derived categories', () => {
  const summary = configSummary(
    parse('cl_crosshairsize 3\ncl_radar_scale 0.5\nnot_known\nbind "unfinished'),
    registry,
  );
  assert.ok(summary.errors > 0);
  assert.ok(summary.information > 0);
  assert.equal(summary.errors + summary.warnings + summary.information, summary.findings);
  assert.equal(summary.crosshair, true);
  assert.equal(summary.radar, true);
  assert.equal(configSummary(parse('alias later "cl_crosshairsize 3"'), registry).crosshair, false);
});
test('new hub actions accept only known host-owned operations', () => {
  for (const type of ['connect', 'explorer', 'openVideo', 'revealSettings', 'savedControls']) {
    assert.equal(isHubMessage({ type }), true);
    assert.equal(isHubMessage({ type, path: '../private' }), false);
  }
});

test('CFG removal messages require a valid name and current snapshot identity', () => {
  assert.equal(isHubMessage({ type: 'delete', file: 'test.cfg', revision: 1 }), true);
  assert.equal(isHubMessage({ type: 'delete', file: '../test.cfg', revision: 1 }), false);
  assert.equal(isHubMessage({ type: 'delete', file: 'test.cfg' }), false);
  assert.equal(
    isHubMessage({ type: 'delete', file: 'test.cfg', revision: 1, path: 'C:/outside' }),
    false,
  );
});
