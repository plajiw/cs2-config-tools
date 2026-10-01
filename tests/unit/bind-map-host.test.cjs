const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const vm = require('node:vm');
const { parse } = require('../../dist/core/parser');
const { effectiveConfig } = require('../../dist/core/effective');
const { CommandRegistry } = require('../../dist/catalog/registry');

test('bind map host scopes resources, refreshes unsaved text, rejects stale navigation and cleans up', async () => {
  const callbacks = {},
    sent = [],
    shown = [];
  const disposable = { dispose() {} };
  const panel = {
    webview: {
      cspSource: 'vscode-webview:',
      asWebviewUri: (uri) => uri,
      postMessage: (message) => {
        sent.push(message);
        return Promise.resolve(true);
      },
      onDidReceiveMessage: (callback) => {
        callbacks.message = callback;
        return disposable;
      },
    },
    onDidDispose: (callback) => {
      callbacks.dispose = callback;
      return disposable;
    },
    onDidChangeViewState: (callback) => {
      callbacks.view = callback;
      return disposable;
    },
    reveal() {},
    dispose() {
      callbacks.dispose();
    },
  };
  let text = 'bind q slot1\n';
  const doc = {
    uri: 'file:///test.cfg',
    version: 1,
    languageId: 'cs2cfg',
    isClosed: false,
    getText: () => text,
  };
  const editor = { document: doc, revealRange() {} };
  const api = {
    env: { language: 'en' },
    Uri: { joinPath: (...parts) => parts.join('/') },
    ViewColumn: { One: 1, Beside: -2 },
    TextEditorRevealType: { InCenterIfOutsideViewport: 2 },
    Selection: class {
      constructor(start, end) {
        this.start = start;
        this.end = end;
      }
    },
    window: {
      activeTextEditor: editor,
      createWebviewPanel: (_type, _title, _column, options) => {
        callbacks.options = options;
        return panel;
      },
      showTextDocument: async (source) => {
        shown.push(source);
        callbacks.view({ webviewPanel: { visible: true } });
        return editor;
      },
    },
    commands: {
      registerCommand: (_name, callback) => {
        callbacks.command = callback;
        return disposable;
      },
    },
    workspace: {
      asRelativePath: (uri) => uri,
      onDidChangeTextDocument: (callback) => {
        callbacks.change = callback;
        return disposable;
      },
      onDidCloseTextDocument: (callback) => {
        callbacks.close = callback;
        return disposable;
      },
      onDidChangeConfiguration: (callback) => {
        callbacks.config = callback;
        return disposable;
      },
    },
  };
  const original = Module._load;
  Module._load = function (name, ...args) {
    return name === 'vscode' ? api : original.call(this, name, ...args);
  };
  let registerBindMap;
  try {
    ({ registerBindMap } = require('../../dist/vscode/bind-map'));
  } finally {
    Module._load = original;
  }
  const registry = new CommandRegistry(require('../../catalog/catalog.json'));
  const context = { extensionUri: 'extension', subscriptions: [] };
  registerBindMap(
    {
      config: () => ({ get: (_key, fallback) => fallback }),
      effective: (source) => effectiveConfig(parse(source.getText()), registry),
      range: (_doc, start, end) => ({ start, end }),
    },
    context,
  );
  assert.deepEqual(callbacks.command(), { entries: 1, partial: false });
  assert.deepEqual(callbacks.options.localResourceRoots, ['extension/resources/webview']);
  assert.match(panel.webview.html, /default-src 'none'/);
  assert.match(panel.webview.html, /script-src 'nonce-[a-f0-9]+'/);
  assert.ok(!panel.webview.html.includes('slot1'), 'CFG data travels via messages, not HTML');
  await callbacks.message({ type: 'ready' });
  await callbacks.message({
    type: 'reveal',
    snapshot: sent.at(-1).snapshot,
    version: 1,
    entry: 0,
    target: 'origin',
  });
  assert.equal(shown.length, 1);
  assert.equal(editor.selection.start, 0);
  text += 'exec other\nbind mouse4 +jump';
  doc.version++;
  callbacks.change({ document: doc });
  await callbacks.message({
    type: 'reveal',
    snapshot: sent.at(-1).snapshot,
    version: 1,
    entry: 0,
    target: 'origin',
  });
  assert.equal(shown.length, 1, 'Reject navigation immediately after edits, before debounce');
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(sent.at(-1).model.partial, true);
  assert.equal(sent.at(-1).model.entries.length, 2);
  await callbacks.message({
    type: 'reveal',
    snapshot: sent.at(-1).snapshot,
    version: 2,
    entry: 999,
    target: 'origin',
  });
  await callbacks.message({
    type: 'reveal',
    snapshot: sent.at(-1).snapshot,
    version: 2,
    entry: 0,
    target: 'origin',
    path: 'private.cfg',
  });
  assert.equal(shown.length, 1);
  const oldSnapshot = sent.at(-1).snapshot;
  const other = { ...doc, uri: 'file:///other.cfg', getText: () => 'bind w slot3' };
  api.window.activeTextEditor = { document: other };
  callbacks.command();
  await callbacks.message({
    type: 'reveal',
    snapshot: oldSnapshot,
    version: 2,
    entry: 0,
    target: 'origin',
  });
  assert.equal(shown.length, 1, 'Same-version document switches invalidate prior clicks');
  api.window.activeTextEditor = editor;
  callbacks.command();
  const fresh = sent.at(-1).snapshot;
  editor.selection = undefined;
  const pending = callbacks.message({
    type: 'reveal',
    snapshot: fresh,
    version: 2,
    entry: 0,
    target: 'origin',
  });
  api.window.activeTextEditor = { document: other };
  callbacks.command();
  await pending;
  assert.equal(
    editor.selection,
    undefined,
    'Do not apply old selection after an asynchronous document switch',
  );
  assert.equal(shown.length, 2);
  api.window.activeTextEditor = editor;
  callbacks.command();
  const prior = sent.at(-1).snapshot;
  const originalText = text;
  text = 'x'.repeat(1_000_001);
  doc.version++;
  callbacks.command();
  assert.equal(sent.at(-1).oversized, true);
  assert.equal(sent.at(-1).model, undefined);
  await callbacks.message({
    type: 'reveal',
    snapshot: prior,
    version: 2,
    entry: 0,
    target: 'origin',
  });
  assert.equal(shown.length, 2, 'Oversized input disables navigation to stale locations');
  text = originalText;
  doc.version++;
  callbacks.command();
  doc.isClosed = true;
  callbacks.close(doc);
  assert.equal(sent.at(-1).unavailable, true);
  await callbacks.message({
    type: 'reveal',
    snapshot: sent.at(-1).snapshot,
    version: 2,
    entry: 0,
    target: 'origin',
  });
  assert.equal(shown.length, 2);
  panel.dispose();
  const count = sent.length;
  callbacks.view({ webviewPanel: { visible: true } });
  assert.equal(sent.length, count);
});

test('webview renders CFG text literally and exposes keyboard, mouse, numpad and other names', () => {
  const nodes = new Map(),
    messages = [];
  class Node {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.textContent = '';
      this.events = {};
      this.dataset = {};
    }
    append(...children) {
      this.children.push(...children);
    }
    replaceChildren(...children) {
      this.children = children;
    }
    addEventListener(name, callback) {
      this.events[name] = callback;
    }
    setAttribute() {}
    focus() {}
    set innerHTML(_value) {
      throw new Error('Unsafe HTML assignment');
    }
  }
  const doc = {
    documentElement: {},
    activeElement: undefined,
    createElement: (tag) => new Node(tag),
    getElementById: (id) => {
      if (!nodes.has(id)) nodes.set(id, new Node('div'));
      return nodes.get(id);
    },
    querySelectorAll: () => [],
  };
  let receive;
  vm.runInNewContext(fs.readFileSync('resources/webview/bind-map.js', 'utf8'), {
    document: doc,
    window: {
      addEventListener: (_name, callback) => {
        receive = callback;
      },
    },
    acquireVsCodeApi: () => ({ postMessage: (message) => messages.push(message) }),
  });
  assert.equal(messages[0].type, 'ready');
  const action = '<img src=x onerror=alert(1)>';
  receive({
    data: {
      type: 'state',
      pt: true,
      snapshot: 4,
      source: 'test.cfg',
      version: 4,
      file: '<cfg>',
      model: {
        partial: false,
        limits: [],
        entries: ['q', 'mouse4', 'kp_home', 'CUSTOM'].map((key) => ({
          key,
          action,
          certain: true,
          origin: { start: 0 },
          definition: { start: 0 },
          changes: [],
        })),
      },
    },
  });
  assert.equal(doc.documentElement.lang, 'pt-BR');
  assert.equal(nodes.get('file').textContent, '<cfg>');
  assert.equal(nodes.get('list').children.length, 4);
  nodes.get('list').children[3].events.click();
  const details = nodes.get('details');
  assert.equal(details.children.find((node) => node.tagName === 'PRE').textContent, action);
  details.children.at(-1).children[0].events.click();
  assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))), {
    type: 'reveal',
    snapshot: 4,
    version: 4,
    entry: 3,
    target: 'origin',
  });
  receive({ data: { type: 'state', pt: false, file: '', unavailable: true } });
  assert.equal(nodes.get('list').children.length, 0);
});
