const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { CommandRegistry } = require('../../dist/catalog/registry');

test('CFG removal uses Trash and refuses dirty buffers, changed files, stale folders and paths outside selection', async () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cs2-removal-')));
  const file = path.join(root, 'test.cfg');
  fs.writeFileSync(file, 'bind q slot1');
  const uri = (p) => ({ fsPath: p, toString: () => 'file:' + p });
  const deleted = [];
  const mock = {
    Uri: { file: uri },
    RelativePattern: class {},
    EventEmitter: class {
      event() {}
      fire() {}
      dispose() {}
    },
    workspace: {
      isTrusted: true,
      textDocuments: [],
      getConfiguration: () => ({ get: (_, fallback) => fallback }),
      createFileSystemWatcher: () => ({
        onDidCreate() {},
        onDidChange() {},
        onDidDelete() {},
        dispose() {},
      }),
      fs: {
        delete: async (target, options) => {
          deleted.push({ target, options });
          fs.unlinkSync(target.fsPath);
        },
      },
    },
  };
  const loader = Module._load;
  let ConfigFolder;
  Module._load = function (name, ...args) {
    return name === 'vscode' ? mock : loader.call(this, name, ...args);
  };
  try {
    ({ ConfigFolder } = require('../../dist/vscode/config-folder'));
  } finally {
    Module._load = loader;
  }
  const folder = new ConfigFolder(
    { update: async () => {} },
    { registry: new CommandRegistry(require('../../catalog/catalog.json')) },
  );
  try {
    await folder.connect(root);
    await assert.rejects(folder.prepareRemoval('../test.cfg'));
    await assert.rejects(folder.prepareRemoval('no-file.cfg'));
    mock.workspace.isTrusted = false;
    await assert.rejects(folder.prepareRemoval('test.cfg'));
    mock.workspace.isTrusted = true;
    mock.workspace.textDocuments = [{ uri: uri(file), isDirty: true }];
    await assert.rejects(folder.prepareRemoval('test.cfg'), /unsaved/);
    mock.workspace.textDocuments = [];
    let target = await folder.prepareRemoval('test.cfg');
    fs.writeFileSync(file, 'changed after confirmation was opened');
    await assert.rejects(folder.remove(target), /changed/);
    target = await folder.prepareRemoval('test.cfg');
    await folder.refresh();
    await assert.rejects(folder.remove(target), /Folder changed/);
    target = await folder.prepareRemoval('test.cfg');
    mock.workspace.textDocuments = [{ uri: uri(file), isDirty: true }];
    await assert.rejects(folder.remove(target), /unsaved/);
    mock.workspace.textDocuments = [];
    assert.deepEqual(deleted, []);
    target = await folder.prepareRemoval('test.cfg');
    await folder.remove(target);
    assert.deepEqual(deleted[0].options, { useTrash: true, recursive: false });
    assert.equal(fs.existsSync(file), false);
    assert.equal(folder.snapshot.files.length, 0);
  } finally {
    folder.dispose();
    if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(root);
  }
});
