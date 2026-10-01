// Production HTML/assets in Chromium with a simulated VS Code bridge.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { configSummary } = require('../dist/core/config-workspace');
const { parse } = require('../dist/core/parser');
const { CommandRegistry } = require('../dist/catalog/registry');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.test-output', 'config-hub-browser');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser =
    process.env.CS2_CFG_BROWSER ||
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  assert.ok(fs.existsSync(browser), 'Set CS2_CFG_BROWSER to a Chromium executable');
  fs.mkdirSync(output, { recursive: true });
  const profile = fs.mkdtempSync(path.join(output, 'profile-'));
  const loader = Module._load;
  Module._load = function (name, ...args) {
    if (name === 'vscode')
      return { Uri: { joinPath: (uri, ...parts) => uri + '/' + parts.join('/') } };
    return loader.call(this, name, ...args);
  };
  let page;
  try {
    page = require('../dist/vscode/config-hub').hubPage;
  } finally {
    Module._load = loader;
  }
  let html = page({ cspSource: 'file:', asWebviewUri: (value) => value }, pathToFileURL(root).href);
  const nonce = /script-src 'nonce-([a-f0-9]+)'/.exec(html)[1];
  const registry = new CommandRegistry(require('../catalog/catalog.json'));
  const files = [
    {
      name: 'autoexec.cfg',
      summary: configSummary(
        parse('bind q slot1\nbind mouse4 +jump\nalias one "echo hello"'),
        registry,
      ),
    },
    { name: 'practice.cfg', summary: configSummary(parse('exec missing\nbind f slot2'), registry) },
  ];
  const state = {
    type: 'state',
    revision: 1,
    connected: true,
    folder: 'D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg',
    typical: true,
    limited: false,
    pt: false,
    files,
  };
  fs.writeFileSync(
    path.join(output, 'bridge.js'),
    `window.smoke = { state: ${JSON.stringify(state)}, messages: [], violations: [] }; document.addEventListener('securitypolicyviolation', e => smoke.violations.push(e.violatedDirective)); window.acquireVsCodeApi = () => ({ postMessage: m => { smoke.messages.push(m); if (m.type === 'ready') setTimeout(() => window.postMessage(smoke.state, '*'), 0); } });`,
  );
  html = html.replace(
    '</head>',
    `<script nonce="${nonce}" src="${pathToFileURL(path.join(output, 'bridge.js')).href}"></script></head>`,
  );
  fs.writeFileSync(path.join(output, 'index.html'), html);
  const child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  const pending = new Map();
  let socket;
  let id = 0;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt++) await delay(100);
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    const target = await (
      await fetch(
        `http://127.0.0.1:${port}/json/new?${encodeURIComponent(pathToFileURL(path.join(output, 'index.html')).href)}`,
        { method: 'PUT' },
      )
    ).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const entry = pending.get(message.id);
      if (entry) {
        pending.delete(message.id);
        clearTimeout(entry.timer);
        message.error
          ? entry.reject(new Error(JSON.stringify(message.error)))
          : entry.resolve(message.result);
      }
    });
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const request = ++id;
        const timer = setTimeout(() => {
          pending.delete(request);
          reject(new Error(`Timeout: ${method}`));
        }, 8000);
        pending.set(request, { resolve, reject, timer });
        socket.send(JSON.stringify({ id: request, method, params }));
      });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate("document.querySelectorAll('#files tr').length === 2")) break;
      await delay(100);
    }
    assert.deepEqual(
      await evaluate("[...document.querySelectorAll('#stats strong')].map(x => x.textContent)"),
      ['2', '3', '0', '1'],
    );
    assert.equal(
      await evaluate("document.querySelectorAll('.tool-card:disabled').length"),
      4,
      'Builders are honestly disabled',
    );
    assert.equal(
      await evaluate("document.querySelectorAll('#files tr')[1].textContent.includes('Partial')"),
      true,
    );
    await evaluate("document.querySelector('#quick [data-action=bindMap]').click()");
    assert.deepEqual(await evaluate('smoke.messages.at(-1)'), {
      type: 'bindMap',
      file: 'autoexec.cfg',
      revision: 1,
    });
    await evaluate("document.getElementById('new').focus()");
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      text: '\r',
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    assert.deepEqual(await evaluate('smoke.messages.at(-1)'), { type: 'new' });
    await evaluate("window.postMessage({...smoke.state, revision: 2, pt: true}, '*')");
    await delay(100);
    assert.equal(await evaluate('document.documentElement.lang'), 'pt-BR');
    assert.equal(
      await evaluate('document.activeElement.id'),
      'new',
      'Live snapshots preserve focus',
    );
    await evaluate(
      "window.postMessage({...smoke.state, folder: '<img src=x onerror=alert(1)>', files: [{name: '<svg onload=alert(1)>.cfg', unavailable: true}]}, '*')",
    );
    await delay(100);
    assert.equal(
      await evaluate("document.querySelectorAll('#files svg, #folder-path img').length"),
      0,
      'Literal paths and file names cannot inject HTML',
    );
    await evaluate("window.postMessage(smoke.state, '*')");
    await delay(100);
    const themes = {
      dark: {
        foreground: '#d4d4d4',
        'editor-background': '#101216',
        'sideBar-background': '#171a1f',
        descriptionForeground: '#a7b1bd',
        'panel-border': '#303740',
        'textLink-foreground': '#54a7ff',
        'button-secondaryBackground': '#242830',
        'button-secondaryHoverBackground': '#303945',
        focusBorder: '#54a7ff',
        'textCodeBlock-background': '#101419',
      },
      light: {
        foreground: '#20242a',
        'editor-background': '#ffffff',
        'sideBar-background': '#f5f5f5',
        descriptionForeground: '#555b65',
        'panel-border': '#cccccc',
        'textLink-foreground': '#006ab1',
        'button-secondaryBackground': '#e7e7e7',
        'button-secondaryHoverBackground': '#d7d7d7',
        focusBorder: '#006ab1',
        'textCodeBlock-background': '#ffffff',
      },
    };
    for (const [theme, variables] of Object.entries(themes)) {
      await evaluate(
        `Object.entries(${JSON.stringify(variables)}).forEach(([key,value]) => document.documentElement.style.setProperty('--vscode-'+key,value))`,
      );
      for (const width of [1440, 420]) {
        await send('Emulation.setDeviceMetricsOverride', {
          width,
          height: 1050,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await delay(100);
        assert.equal(
          await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),
          true,
          `${theme} ${width} page fits`,
        );
        const shot = await send('Page.captureScreenshot', { captureBeyondViewport: true });
        fs.writeFileSync(
          path.join(output, `${theme}-${width}.png`),
          Buffer.from(shot.data, 'base64'),
        );
      }
    }
    await evaluate(
      "window.postMessage({...smoke.state, connected: false, folder: undefined, files: [], revision: 3}, '*')",
    );
    await delay(100);
    assert.equal(await evaluate("document.getElementById('welcome').hidden"), false);
    assert.equal(await evaluate("document.getElementById('new').disabled"), true);
    assert.deepEqual(await evaluate('smoke.violations'), []);
    console.log(
      `PASS: Config hub browser: derived counts, planned tools, keyboard activation, typed actions, focus, literal safety, first-use state and responsive dark/light screenshots. ${output}`,
    );
    socket.send(JSON.stringify({ id: ++id, method: 'Browser.close' }));
    await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1500)]);
  } finally {
    for (const entry of pending.values()) clearTimeout(entry.timer);
    socket?.close();
    if (child.exitCode === null) child.kill();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
