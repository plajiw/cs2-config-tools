const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('unified connection discovers both sources and authorizes them in one confirmation', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs2-connection-'));
  const cfg = path.join(root, 'cfg'),
    profile = path.join(root, 'userdata', '123', '730', 'local', 'cfg');
  fs.mkdirSync(cfg);
  fs.mkdirSync(profile, { recursive: true });
  const calls = [],
    prompts = [];
  let approve = true,
    pick;
  const mock = {
    window: {
      showInformationMessage: async (title, options, allow) => {
        prompts.push({ title, options });
        assert.deepEqual(calls, [], 'Neither source reads content before consent');
        return approve ? allow : undefined;
      },
      showQuickPick: async (items) => pick?.(items),
      showOpenDialog: async () => undefined,
    },
  };
  const loader = Module._load;
  let connectConfiguration;
  Module._load = function (name, ...args) {
    return name === 'vscode' ? mock : loader.call(this, name, ...args);
  };
  try {
    ({ connectConfiguration } = require('../../dist/vscode/configuration-connection'));
  } finally {
    Module._load = loader;
  }
  const folder = { snapshot: {}, connect: async (p) => calls.push(['cfg', p]) };
  const userdata = { snapshot: {}, connect: async (p) => calls.push(['userdata', p]) };
  const discovery = { cfg: async () => [cfg], userdata: async () => [profile] };
  try {
    await connectConfiguration(folder, userdata, true, discovery);
    assert.deepEqual(calls, [
      ['cfg', fs.realpathSync(cfg)],
      ['userdata', fs.realpathSync(profile)],
    ]);
    assert.equal(prompts.length, 1);
    assert.ok(prompts[0].options.detail.includes(cfg));
    assert.ok(prompts[0].options.detail.includes(profile));
    assert.match(prompts[0].options.detail, /sem login na Steam/);
    calls.length = 0;
    approve = false;
    await connectConfiguration(folder, userdata, false, discovery);
    assert.deepEqual(calls, [], 'Canceled combined consent connects nothing');
    prompts.length = 0;
    approve = true;
    await connectConfiguration(folder, userdata, false, { ...discovery, userdata: async () => [] });
    assert.deepEqual(prompts, [], 'Canceled selection does not prompt or connect');
    pick = (items) => items.find((item) => item.folder === 'skip');
    await connectConfiguration(folder, userdata, false, { ...discovery, userdata: async () => [] });
    assert.deepEqual(
      calls,
      [['cfg', fs.realpathSync(cfg)]],
      'Missing userdata supports CFG-only connection',
    );
    calls.length = 0;
    prompts.length = 0;
    const otherProfile = path.join(root, 'other');
    fs.mkdirSync(otherProfile);
    pick = (items) => items.find((item) => item.folder === otherProfile);
    await connectConfiguration(folder, userdata, false, {
      ...discovery,
      userdata: async () => [profile, otherProfile],
    });
    assert.deepEqual(calls[1], ['userdata', fs.realpathSync(otherProfile)]);
    assert.equal(
      prompts.length,
      1,
      'Multiple profiles require explicit selection and single consent',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
