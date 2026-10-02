const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseVideoSettings,
  videoRows,
  videoSettingDefinitions,
} = require('../../dist/core/video-settings');
const { configFileOrigin, isHubMessage } = require('../../dist/core/config-workspace');

const sample =
  '\ufeff"video.cfg" { // sample, not a game assertion\n"setting.defaultres" "1280" "setting.defaultresheight" "960" "setting.refreshrate_numerator" "74973" "setting.refreshrate_denominator" "1000" "unknown" "literal" }';
test('video derives only arithmetic and preserves unknown fields and literal enums', () => {
  const model = parseVideoSettings(sample);
  assert.deepEqual(model.issues, []);
  assert.deepEqual(model.resolution, { width: 1280, height: 960, aspectRatio: '4:3' });
  assert.equal(model.refreshRate.hz, 74.973);
  assert.equal(videoRows(model, true)[0].label, 'Largura');
  assert.equal(videoRows(model, false).at(-1).value, 'literal');
  const raw = parseVideoSettings('"video.cfg" { "setting.msaa_samples" "0" }');
  assert.equal(videoRows(raw, false)[0].value, '0');
  assert.ok(
    videoSettingDefinitions.every(
      (definition) =>
        !definition.editable && definition.source && definition.confidence === 'unverified',
    ),
  );
});
test('video refuses certainty for duplicate, nested, truncated and unsupported structures', () => {
  for (const text of [
    sample.replace('"unknown" "literal"', '"SETTING.DEFAULTRES" "1920"'),
    sample.slice(0, -1),
    '"video.cfg" { "nested" { "x" "y" } }',
    '"video.cfg" { "x" "unfinished }',
    '"video.cfg" { "x" "a\\b" }',
    'x'.repeat(256001),
  ]) {
    const model = parseVideoSettings(text);
    assert.ok(model.issues.length);
    assert.equal(model.resolution, undefined);
    assert.equal(model.refreshRate, undefined);
  }
});
test('video rejects invalid derived numbers without inventing ranges or defaults', () => {
  for (const value of ['0', '-1', '1.5', 'Infinity', '9007199254740993']) {
    const model = parseVideoSettings(sample.replace('"1000"', '"' + value + '"'));
    assert.equal(model.refreshRate, undefined);
  }
});
test('file origin is a bounded name hint, not an assertion about custom folders', () => {
  assert.equal(configFileOrigin('autoexec.cfg', true), 'user');
  assert.equal(configFileOrigin('gamemode_custom.cfg', true), 'game');
  assert.equal(configFileOrigin('server.cfg', true), 'game');
  assert.equal(configFileOrigin('gamemode_custom.cfg', false), 'unknown');
  assert.equal(configFileOrigin('my-training.cfg', true), 'unknown');
});
test('userdata UI protocol never accepts arbitrary filesystem paths or writes', () => {
  for (const type of [
    'connectSettings',
    'detectSettings',
    'disconnectSettings',
    'video',
    'rawVideo',
  ]) {
    assert.equal(isHubMessage({ type }), true);
    assert.equal(isHubMessage({ type, path: 'C:\\private' }), false);
  }
  assert.equal(isHubMessage({ type: 'saveVideo' }), false);
});
