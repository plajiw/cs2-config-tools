const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { parse } = require('../../dist/core/parser');
const { CommandRegistry } = require('../../dist/catalog/registry');
const { effectiveConfig } = require('../../dist/core/effective');
const { bindMapModel } = require('../../dist/core/bind-map');
const registry = new CommandRegistry(require('../../catalog/catalog.json'));

test('reviewed whole-action labels require the same literal shape as the builder', () => {
  for (const [body, label] of [
    ['slot8', 'Smoke Grenade'],
    ['slot8 unexpected', undefined],
    ['slot8;echo hi', undefined],
    ['slot8 "bad', undefined],
  ]) {
    const source = `bind x "${body}"`;
    const model = bindMapModel(effectiveConfig(parse(source), registry), {
      registry,
      source,
      language: 'en',
    });
    assert.equal(model.entries[0]?.meaning, label);
    if (body === 'slot8 unexpected') assert.equal(model.entries[0].action, body);
  }
});

test('document links deduplicate, bound concurrency, preserve locations and stop scheduling on cancel', async () => {
  const load = Module._load;
  Module._load = function (name, ...args) {
    return name === 'vscode' ? {} : load.call(this, name, ...args);
  };
  let resolveDocumentLinks;
  try {
    ({ resolveDocumentLinks } = require('../../dist/vscode/document-links'));
  } finally {
    Module._load = load;
  }
  const statements = parse(
    'exec same\nexec same.cfg\n' +
      Array.from({ length: 100 }, (_, i) => `exec file${i}`).join('\n'),
  ).statements;
  let active = 0,
    peak = 0,
    calls = 0,
    cancel = false;
  const results = await resolveDocumentLinks(
    statements,
    () => false,
    async (s) => {
      active++;
      peak = Math.max(peak, active);
      calls++;
      await new Promise((r) => setTimeout(r, 1));
      active--;
      return s.tokens[1].value;
    },
  );
  assert.equal(calls, 101);
  assert.equal(results.length, 102);
  assert.ok(peak <= 4);
  assert.equal(results[0].statement.start, 0);
  calls = 0;
  assert.deepEqual(
    await resolveDocumentLinks(
      statements,
      () => cancel,
      async () => {
        calls++;
        await new Promise((r) => setImmediate(r));
        cancel = true;
        return 'target';
      },
    ),
    [],
  );
  assert.ok(calls <= 4);
  assert.deepEqual(
    await resolveDocumentLinks(
      parse('exec ../outside\nexec C:/absolute\nexec /absolute').statements,
      () => false,
      async () => {
        throw Error('Invalid target scheduled');
      },
    ),
    [],
  );
});

test('catalog startup fails visibly before any provider registration', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cs2-catalog-startup-'));
  fs.mkdirSync(path.join(temporary, 'catalog'));
  const load = Module._load,
    messages = [],
    registrations = [];
  Module._load = function (name, ...args) {
    if (name === 'vscode')
      return { env: { language: 'en' }, window: { showErrorMessage: (m) => messages.push(m) } };
    if (name.startsWith('./vscode/') && !name.endsWith('/services'))
      return new Proxy({}, { get: () => () => registrations.push(name) });
    return load.call(this, name, ...args);
  };
  try {
    delete require.cache[require.resolve('../../dist/extension')];
    const { activate } = require('../../dist/extension');
    for (const text of [
      undefined,
      '{',
      JSON.stringify({ entries: [{ name: 'duplicate' }, { name: 'duplicate' }] }),
    ]) {
      const file = path.join(temporary, 'catalog/catalog.json');
      if (text !== undefined) fs.writeFileSync(file, text);
      activate({ extensionPath: temporary, subscriptions: [] });
    }
    assert.equal(messages.length, 3);
    assert.equal(registrations.length, 0);
    assert.ok(
      messages.every(
        (m) => m.includes('catalog') && m.includes('Reinstall') && m.includes('unavailable'),
      ),
    );
    fs.writeFileSync(
      path.join(temporary, 'catalog/catalog.json'),
      JSON.stringify(require('../../catalog/catalog.json')),
    );
    activate({ extensionPath: temporary, subscriptions: [] });
    assert.equal(messages.length, 3, 'Normal catalog produces no recovery error');
    assert.ok(registrations.length > 0, 'Normal activation registers providers');
  } finally {
    Module._load = load;
    fs.rmSync(temporary, { recursive: true });
  }
});

test('browser startup retries temporary locks but reports permanent failures', async () => {
  const { browserPort } = require('../../scripts/lib/test-lifecycle.cjs');
  let calls = 0;
  assert.equal(
    await browserPort('port', { exitCode: null }, () => {
      if (calls++ === 0) throw Object.assign(Error('sharing'), { code: 'EBUSY' });
      return '9222\n';
    }),
    9222,
  );
  await assert.rejects(
    browserPort('port', { exitCode: null }, () => {
      throw Object.assign(Error('denied'), { code: 'EACCES' });
    }),
    /denied/,
  );
});

test('cleanup preserves a primary failure and rejects targets outside the run', async () => {
  const { cleanupOwned } = require('../../scripts/lib/test-lifecycle.cjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs2-cleanup-')),
    directory = fs.mkdtempSync(path.join(root, 'owned-'));
  const rm = fs.promises.rm,
    log = console.error,
    logs = [];
  fs.promises.rm = async () => {
    throw Error('secondary cleanup failure');
  };
  console.error = (...args) => logs.push(args);
  try {
    await cleanupOwned(directory, root, Error('primary assertion'));
    assert.equal(logs[0][0], 'CLEANUP FAILURE:');
    await assert.rejects(cleanupOwned(directory, root), /secondary cleanup/);
    await assert.rejects(cleanupOwned(root, directory), /outside/);
  } finally {
    fs.promises.rm = rm;
    console.error = log;
    fs.rmdirSync(directory);
    fs.rmdirSync(root);
  }
});
