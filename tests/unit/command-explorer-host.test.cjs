const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { CommandRegistry } = require('../../dist/catalog/registry');

test('explorer adapter binds search, documentation and copy to registry-owned selections', async () => {
  const events = {};
  let picker, panel, copied;
  const event = (name) => (callback) => {
    events[name] = callback;
    return {
      dispose() {
        delete events[name];
      },
    };
  };
  const mock = {
    ThemeIcon: class {
      constructor(id) {
        this.id = id;
      }
    },
    Uri: { joinPath: (root, ...parts) => [root, ...parts].join('/') },
    ViewColumn: { Active: 1 },
    workspace: { getConfiguration: () => ({ get: (_, fallback) => fallback }) },
    env: {
      clipboard: {
        writeText: async (text) => {
          copied = text;
        },
      },
    },
    window: {
      createWebviewPanel() {
        panel = {
          reveal() {},
          dispose() {
            events.dispose?.();
          },
          onDidDispose: event('dispose'),
          webview: {
            cspSource: 'local:',
            asWebviewUri: (value) => value,
            onDidReceiveMessage: event('message'),
            postMessage: async (message) => {
              panel.last = message;
            },
          },
        };
        return panel;
      },
      createQuickPick() {
        picker = {
          value: '',
          selectedItems: [],
          show() {},
          hide() {
            events.hide?.();
          },
          dispose() {},
          onDidChangeValue: event('value'),
          onDidAccept: event('accept'),
          onDidHide: event('hide'),
          onDidTriggerButton: event('toggle'),
        };
        return picker;
      },
    },
  };
  const loader = Module._load;
  let CommandExplorer;
  Module._load = function (name, ...args) {
    return name === 'vscode' ? mock : loader.call(this, name, ...args);
  };
  try {
    ({ CommandExplorer } = require('../../dist/vscode/command-explorer'));
  } finally {
    Module._load = loader;
  }
  const explorer = new CommandExplorer(
    { registry: new CommandRegistry(require('../../catalog/catalog.json')) },
    'extension',
    () => true,
  );
  explorer.show();
  assert.match(panel.webview.html, /default-src 'none'/);
  picker.value = 'cl_radar_scale';
  events.value();
  assert.equal(picker.items[0].label, 'cl_radar_scale');
  picker.selectedItems = [picker.items[0]];
  events.accept();
  assert.equal(panel.last.name, 'cl_radar_scale');
  assert.equal(panel.last.pt, true);
  assert.ok(panel.last.blocks.length);
  events.message({ type: 'copy', name: 'exec' });
  assert.equal(copied, undefined);
  events.message({ type: 'copy' });
  assert.equal(copied, 'cl_radar_scale');
  events.message({ type: 'search' });
  picker.value = 'cl_crosshairsize';
  events.value();
  assert.equal(
    picker.items.some((item) => item.label === 'cl_crosshairsize'),
    false,
  );
  events.toggle();
  assert.equal(picker.items[0].label, 'cl_crosshairsize');
  explorer.dispose();
  assert.equal(events.message, undefined);
  assert.equal(events.accept, undefined);
});
