const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { CommandRegistry } = require('../../dist/catalog/registry');

test('builder adapter invalidates cancelled/switched/stale previews and confines resources/messages', async () => {
  fs.mkdirSync(path.resolve(__dirname, '../../.test-output'), { recursive: true });
  const directory = fs.mkdtempSync(
    path.join(path.resolve(__dirname, '../../.test-output'), 'builder-host-unit-'),
  );
  const uri = (name) => ({
    scheme: 'file',
    fsPath: path.join(directory, name),
    toString() {
      return this.fsPath;
    },
  });
  const first = uri('first.cfg'),
    second = uri('second.cfg');
  fs.writeFileSync(first.fsPath, 'bind x slot8');
  fs.writeFileSync(second.fsPath, 'bind x slot7');
  const docs = new Map(
    [first, second].map((u) => [
      u.toString(),
      {
        uri: u,
        version: 1,
        isClosed: false,
        lineCount: 1,
        offsetAt: () => fs.statSync(u.fsPath).size,
        getText: () => fs.readFileSync(u.fsPath, 'utf8'),
      },
    ]),
  );
  const sent = [];
  let receive,
    disposed,
    options,
    writes = 0;
  const noop = { dispose() {} };
  const panel = {
    webview: {
      cspSource: 'vscode-resource:',
      asWebviewUri: (u) => u.fsPath,
      postMessage: (m) => {
        sent.push(m);
        return Promise.resolve(true);
      },
      onDidReceiveMessage: (f) => {
        receive = f;
        return noop;
      },
    },
    reveal() {},
    onDidDispose: (f) => {
      disposed = f;
      return noop;
    },
    dispose: () => disposed(),
  };
  const mock = {
    Position: class {
      constructor(line, character) {
        this.line = line;
        this.character = character;
      }
    },
    Uri: { joinPath: (root, ...parts) => ({ fsPath: path.join(root.fsPath, ...parts) }) },
    ViewColumn: { Active: 1 },
    env: { language: 'en' },
    workspace: {
      isTrusted: true,
      textDocuments: [],
      registerTextDocumentContentProvider: () => noop,
      getConfiguration: () => ({ get: (_, fallback) => fallback }),
      openTextDocument: async (u) => docs.get(u.toString()),
    },
    window: {
      createWebviewPanel: (_id, _title, _column, o) => {
        options = o;
        return panel;
      },
      showTextDocument: async () => ({
        edit: async () => {
          writes++;
          return true;
        },
      }),
      showQuickPick: async () => undefined,
    },
  };
  const original = Module._load;
  Module._load = function (request, ...args) {
    return request === 'vscode' ? mock : original.call(this, request, ...args);
  };
  let AutoexecBuilder;
  try {
    delete require.cache[require.resolve('../../dist/vscode/autoexec-builder')];
    ({ AutoexecBuilder } = require('../../dist/vscode/autoexec-builder'));
  } finally {
    Module._load = original;
  }
  const builder = new AutoexecBuilder(
    { registry: new CommandRegistry(require('../../catalog/catalog.json')) },
    { extensionUri: uri('extension') },
    () => directory,
  );
  const draft = {
    type: 'preview',
    changes: [{ key: 'x', action: { command: 'slot10', parameters: [] }, replace: true }],
  };
  const preview = async () => {
    await receive(draft);
    return sent.findLast((m) => m.type === 'preview').snapshot;
  };
  try {
    await builder.show(first);
    assert.equal(
      options.retainContextWhenHidden,
      true,
      'Draft survives raw diff/editor navigation',
    );
    assert.equal(options.localResourceRoots.length, 1);
    assert.match(panel.webview.html, /default-src 'none'/);
    assert.doesNotMatch(panel.webview.html, /unsafe-inline/);
    await receive({ type: 'ready' });
    assert.equal(sent.at(-1).destination, first.fsPath);
    const firstDoc = docs.get(first.toString());
    const text = firstDoc.getText,
      offset = firstDoc.offsetAt;
    firstDoc.offsetAt = () => 1_000_001;
    firstDoc.getText = () => {
      throw new Error('Oversized buffer must not be copied');
    };
    await receive(draft);
    assert.equal(builder.snapshot, undefined, 'Oversized unsaved source has no authorized preview');
    assert.equal(sent.at(-1).type, 'error');
    assert.match(sent.at(-1).message, /large|limit|grande/i);
    firstDoc.getText = text;
    firstDoc.offsetAt = offset;
    await builder.chooseDestination();
    assert.equal(fs.readFileSync(first.fsPath, 'utf8'), 'bind x slot8');
    let snapshot = await preview();
    await receive({ type: 'cancel' });
    await receive({ type: 'apply', snapshot, acknowledge: true });
    assert.equal(writes, 0);
    snapshot = await preview();
    await builder.show(second);
    await receive({ type: 'apply', snapshot, acknowledge: true });
    assert.equal(writes, 0, 'Old destination preview cannot be applied after a switch');
    const staleA = snapshot;
    snapshot = await preview();
    await receive({ type: 'apply', snapshot: staleA, acknowledge: true });
    assert.equal(writes, 0, 'An old Apply is rejected even after B has a new preview');
    snapshot = await preview();
    await receive({ type: 'apply', snapshot, acknowledge: true, path: first.fsPath });
    assert.equal(writes, 0, 'Arbitrary paths are rejected at the message boundary');
    await receive({ type: 'apply', snapshot, acknowledge: false });
    assert.equal(writes, 0, 'Uncertainty acknowledgement is enforced by the host');
    snapshot = await preview();
    fs.writeFileSync(second.fsPath, '// intervening disk change');
    await receive({ type: 'apply', snapshot, acknowledge: true });
    assert.equal(writes, 0);
    assert.equal(fs.readFileSync(second.fsPath, 'utf8'), '// intervening disk change');
    fs.writeFileSync(second.fsPath, 'bind x slot7');
    snapshot = await preview();
    await builder.show({ ...second, toString: () => second.toString() });
    await receive({ type: 'apply', snapshot, acknowledge: true });
    assert.equal(writes, 1, 'Reopening the same URI preserves its fresh preview');

    await preview();
    builder.snapshot.uri = first;
    await receive({ type: 'apply', snapshot: builder.sequence, acknowledge: true });
    assert.equal(writes, 1, 'A snapshot URI cannot differ from the host destination');

    // Hold a filesystem await, then switch B -> A -> B (same URI/object, different generation).
    const originalRead = fs.promises.open;
    let release, entered;
    const waiting = new Promise((resolve) => {
      entered = resolve;
    });
    fs.promises.open = async (...args) => {
      const text = await originalRead(...args);
      entered();
      await new Promise((resolve) => {
        release = resolve;
      });
      return text;
    };
    try {
      const count = sent.filter((m) => m.type === 'preview').length;
      const pending = receive(draft);
      await waiting;
      await builder.show(first);
      await builder.show(second);
      fs.promises.open = originalRead;
      release();
      await pending;
      assert.equal(
        sent.filter((m) => m.type === 'preview').length,
        count,
        'Late filesystem preview is discarded after an ABA destination transition',
      );
      assert.equal(builder.snapshot, undefined);
    } finally {
      fs.promises.open = originalRead;
      release?.();
    }

    const documentB = docs.get(second.toString());
    const getText = documentB.getText;
    documentB.getText = () => 'x'.repeat(1_000_001);
    await receive(draft);
    assert.equal(builder.snapshot, undefined, 'Oversized editor buffer never authorizes Apply');
    assert.match(sent.at(-1).message, /TOO_LARGE/);
    documentB.getText = getText;

    snapshot = await preview();
    const showEditor = mock.window.showTextDocument;
    let releaseEditor, enteredEditor;
    const editorWaiting = new Promise((resolve) => {
      enteredEditor = resolve;
    });
    mock.window.showTextDocument = async (...args) => {
      enteredEditor();
      await new Promise((resolve) => {
        releaseEditor = resolve;
      });
      return showEditor(...args);
    };
    const pendingApply = receive({ type: 'apply', snapshot, acknowledge: true });
    await editorWaiting;
    await builder.show(first);
    releaseEditor();
    await pendingApply;
    mock.window.showTextDocument = showEditor;
    assert.equal(writes, 1, 'Destination change during Apply await prevents editing');

    const openDocument = mock.workspace.openTextDocument;
    let cancelRelease, cancelEntered;
    const cancelWaiting = new Promise((resolve) => {
      cancelEntered = resolve;
    });
    mock.workspace.openTextDocument = async (...args) => {
      cancelEntered();
      await new Promise((resolve) => {
        cancelRelease = resolve;
      });
      return openDocument(...args);
    };
    const previewsBeforeCancel = sent.filter((message) => message.type === 'preview').length;
    const cancelPreview = receive(draft);
    await cancelWaiting;
    await receive({ type: 'cancel' });
    cancelRelease();
    await cancelPreview;
    mock.workspace.openTextDocument = openDocument;
    assert.equal(builder.snapshot, undefined, 'Cancel invalidates a pending preview');
    assert.equal(sent.filter((message) => message.type === 'preview').length, previewsBeforeCancel);
    assert.equal(writes, 1, 'Cancel during preview performs no edits');
    let releaseOpen, enteredOpen;
    const opening = new Promise((resolve) => {
      enteredOpen = resolve;
    });
    mock.workspace.openTextDocument = async (...args) => {
      enteredOpen();
      await new Promise((resolve) => {
        releaseOpen = resolve;
      });
      return openDocument(...args);
    };
    const count = sent.length;
    const pendingPreview = receive(draft);
    await opening;
    builder.dispose();
    releaseOpen();
    await pendingPreview;
    assert.equal(sent.length, count, 'Disposed panels cannot publish late previews/errors');
    assert.equal(builder.snapshot, undefined);
  } finally {
    builder.dispose();
    fs.unlinkSync(first.fsPath);
    fs.unlinkSync(second.fsPath);
    fs.rmdirSync(directory);
  }
});
