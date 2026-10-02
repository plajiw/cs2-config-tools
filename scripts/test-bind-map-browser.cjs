// Real DOM and keyboard smoke checks. This does not replace Extension Host integration.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { parse } = require('../dist/core/parser');
const { effectiveConfig } = require('../dist/core/effective');
const { bindMapModel } = require('../dist/core/bind-map');
const { CommandRegistry } = require('../dist/catalog/registry');

const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, '.test-output'), { recursive: true });
const output = fs.mkdtempSync(path.join(root, '.test-output', 'bind-map-browser-'));
const { browserPort } = require('./lib/test-lifecycle.cjs');
const browserPath =
  process.env.CS2_CFG_BROWSER ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  if (!fs.existsSync(browserPath))
    throw new Error('Set CS2_CFG_BROWSER to a Chromium browser executable.');
  fs.mkdirSync(output, { recursive: true });
  // Each run owns an isolated temporary browser profile; never use the personal browser profile.
  const profile = fs.mkdtempSync(path.join(output, 'profile-'));
  const original = Module._load;
  Module._load = function (name, ...args) {
    if (name === 'vscode')
      return { Uri: { joinPath: (uri, ...parts) => new URL(parts.join('/'), uri).href } };
    return original.call(this, name, ...args);
  };
  let bindMapPage;
  try {
    ({ bindMapPage } = require('../dist/vscode/bind-map'));
  } finally {
    Module._load = original;
  }
  const assets = pathToFileURL(path.join(root, 'resources', 'webview') + path.sep).href;
  let html = bindMapPage({ cspSource: 'file:', asWebviewUri: (uri) => uri }, assets);
  const nonce = /script-src 'nonce-([a-f0-9]+)'/.exec(html)[1];
  const source = [
    'bind q slot1',
    'bind q slot2',
    'exec external',
    'bind mouse4 +jump',
    'bind kp_home slot3',
    'bind CUSTOM "echo <img src=x onerror=alert(1)>"',
  ].join('\n');
  const registry = new CommandRegistry(require('../catalog/catalog.json'));
  const model = bindMapModel(effectiveConfig(parse(source), registry), {
    registry,
    source,
    language: 'en',
  });
  const initial = {
    type: 'state',
    snapshot: 1,
    version: 1,
    source: 'synthetic.cfg',
    file: 'tests/fixtures/synthetic.cfg',
    pt: false,
    model,
  };
  fs.writeFileSync(
    path.join(output, 'bridge.js'),
    `window.smoke = { state: ${JSON.stringify(initial)}, messages: [], violations: [] };
document.addEventListener('securitypolicyviolation', e => window.smoke.violations.push(e.violatedDirective));
window.acquireVsCodeApi = () => ({ postMessage: m => { window.smoke.messages.push(m); if(m.type === 'ready') setTimeout(() => window.postMessage(window.smoke.state, '*'), 0); } });`,
  );
  const bridge = pathToFileURL(path.join(output, 'bridge.js')).href;
  html = html.replace('</head>', `<script nonce="${nonce}" src="${bridge}"></script></head>`);
  fs.writeFileSync(path.join(output, 'index.html'), html);
  const child = spawn(
    browserPath,
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
  let socket;
  const pending = new Map();
  try {
    const port = await browserPort(path.join(profile, 'DevToolsActivePort'), child);
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
    let id = 0;
    const errors = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown')
        errors.push(message.params.exceptionDetails.text);
      const item = pending.get(message.id);
      if (item) {
        pending.delete(message.id);
        clearTimeout(item.timer);
        message.error
          ? item.reject(new Error(JSON.stringify(message.error)))
          : item.resolve(message.result);
      }
    });
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const request = ++id;
        const timer = setTimeout(() => {
          pending.delete(request);
          reject(new Error(`Timed out: ${method}`));
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
    const waitFor = async (expression) => {
      for (let attempt = 0; attempt < 50; attempt++) {
        if (await evaluate(expression)) return;
        await delay(100);
      }
      throw new Error(`Condition not met: ${expression}`);
    };
    const key = async (name, code) => {
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: name,
        code: name === ' ' ? 'Space' : name,
        windowsVirtualKeyCode: code,
        text: name === 'Enter' ? '\r' : name === ' ' ? ' ' : '',
      });
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: name,
        code: name,
        windowsVirtualKeyCode: code,
      });
    };
    await send('Runtime.enable');
    await send('Page.bringToFront');
    await waitFor("document.querySelectorAll('#list button').length === 4");
    assert.equal(
      await evaluate("document.querySelectorAll('#keyboard g[role=button]').length"),
      104,
    );
    assert.equal(await evaluate("document.querySelectorAll('#mouse g[role=button]').length"), 5);
    assert.equal(await evaluate("document.querySelectorAll('#mouse-actions button').length"), 7);
    assert.ok(
      await evaluate(
        "CS2InputLayout.mouse.filter(d => !d.external).every(d => {const face=document.querySelector('#mouse [data-key='+d.cs2Key+'] .key-face');const point=new DOMPoint(d.x,d.y);return face.isPointInFill(d.transform ? point.matrixTransform(face.transform.baseVal.consolidate().matrix.inverse()) : point)})",
      ),
      'Mouse labels stay within their button paths',
    );
    await evaluate("document.querySelector('#mouse').scrollIntoView({block:'center'});true");
    assert.ok(
      await evaluate(
        "CS2InputLayout.mouse.filter(d=>!d.external).every(d=>{const face=document.querySelector('#mouse [data-key='+d.cs2Key+'] .key-face');const p=new DOMPoint(d.transform?260-d.x:d.x,d.y).matrixTransform(face.getScreenCTM());return document.elementFromPoint(p.x,p.y)?.closest('[data-key]')?.dataset.key===d.cs2Key})",
      ),
      'Each mouse label has its own unobstructed hit target',
    );
    await evaluate("document.querySelector('#mouse-actions [data-key=mwheelup]').focus()");
    await key('Enter', 13);
    assert.equal(await evaluate("document.querySelector('#details h3').textContent"), 'Wheel up');
    await evaluate("document.querySelector('#mouse-actions [data-key=mwheeldown]').focus()");
    await key(' ', 32);
    assert.equal(await evaluate("document.querySelector('#details h3').textContent"), 'Wheel down');
    assert.equal(
      await evaluate("document.querySelector('#keyboard [data-key=q] .state-marker').tagName"),
      'circle',
    );
    assert.equal(
      await evaluate(
        "document.querySelector('#keyboard [data-key=q] .state-marker').style.display",
      ),
      '',
    );
    assert.equal(
      await evaluate(
        "document.querySelector('#keyboard [data-key=q]').classList.contains('uncertain')",
      ),
      true,
    );
    assert.equal(
      await evaluate("document.querySelector('#keyboard [data-key=q] .status-marker').textContent"),
      '!',
    );
    await evaluate(
      "window.originalKeyboard=document.querySelector('#keyboard svg'); document.querySelector('#keyboard [data-key=z]').dispatchEvent(new MouseEvent('click')); true",
    );
    assert.ok(
      await evaluate("document.querySelector('#details').textContent.includes('No binding found')"),
    );
    await evaluate(
      "document.querySelector('#filter-panel').open=true; document.querySelector('#category').focus(); true",
    );
    await key('ArrowDown', 40);
    assert.equal(
      await evaluate("document.querySelector('#category').getAttribute('aria-expanded')"),
      'true',
    );
    await key('ArrowDown', 40);
    await key('Enter', 13);
    assert.equal(await evaluate("document.querySelector('#category').value"), 'movement');
    assert.equal(await evaluate('document.activeElement.id'), 'category');
    assert.equal(
      await evaluate("document.querySelector('#category-value').textContent"),
      'Movement',
    );
    assert.ok(
      await evaluate(
        "getComputedStyle(document.querySelector('#category .category-dot')).color === getComputedStyle(document.querySelector('#mouse [data-key=mouse4] .state-marker')).fill",
      ),
      'Filter dots use the same category palette as the input map',
    );
    await key('ArrowDown', 40);
    await key('End', 35);
    assert.equal(await evaluate('document.activeElement.dataset.value'), 'custom');
    await key('Home', 36);
    assert.equal(await evaluate('document.activeElement.dataset.value'), 'all');
    await key('g', 71);
    assert.equal(await evaluate('document.activeElement.dataset.value'), 'grenades');
    await key('Escape', 27);
    assert.equal(await evaluate('document.activeElement.id'), 'category');
    assert.equal(await evaluate("document.querySelector('#category').value"), 'movement');
    await key('ArrowDown', 40);
    await key('Tab', 9);
    assert.equal(await evaluate('document.activeElement.id'), 'state-filter');
    assert.equal(await evaluate("document.querySelector('#category-menu').hidden"), true);
    await evaluate(
      "document.querySelector('#category').click(); window.postMessage(window.smoke.state,'*'); true",
    );
    await waitFor(
      "document.activeElement.id === 'category' && document.querySelector('#category-menu').hidden",
    );
    assert.equal(await evaluate("document.querySelector('#category').value"), 'movement');
    assert.ok(
      await evaluate(
        "document.querySelector('#keyboard [data-key=q]').classList.contains('muted')",
      ),
    );
    assert.ok(
      await evaluate(
        "!document.querySelector('#mouse [data-key=mouse4]').classList.contains('muted')",
      ),
    );
    assert.equal(
      await evaluate("document.querySelectorAll('#keyboard g[role=button]').length"),
      104,
    );
    await evaluate(
      "document.querySelector('#category').value='all'; document.querySelector('#category').dispatchEvent(new Event('change')); document.querySelector('#mouse [data-key=mouse4]').dispatchEvent(new MouseEvent('click')); true",
    );
    assert.equal(await evaluate("document.querySelector('#details h3').textContent"), 'M4');
    assert.equal(
      await evaluate("document.querySelectorAll('#details ol').length"),
      0,
      'Single assignments do not show redundant history',
    );
    assert.ok(await evaluate("document.querySelector('#details .meaning').textContent.length > 0"));
    assert.equal(await evaluate("document.querySelectorAll('#legend li').length"), 4);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(100);
    assert.ok(
      await evaluate(
        "document.querySelector('.mouse-area').getBoundingClientRect().left >= document.querySelector('.keyboard-area').getBoundingClientRect().right",
      ),
      'Wide devices share a row without compressing the keyboard',
    );
    assert.ok(await evaluate("document.querySelector('#keyboard').clientWidth >= 1080"));
    assert.ok(
      await evaluate(
        "document.querySelector('#keyboard').scrollWidth <= document.querySelector('#keyboard').clientWidth",
      ),
      'Wide keyboard has no unnecessary scrollbar',
    );
    // Representative VS Code theme variables; these are reference colors, not the user's theme.
    await evaluate(`Object.entries({
      '--vscode-font-family':'Segoe UI, sans-serif', '--vscode-editor-background':'#1e1e1e',
      '--vscode-editor-foreground':'#d4d4d4', '--vscode-button-secondaryBackground':'#313131',
      '--vscode-button-secondaryForeground':'#ffffff', '--vscode-button-secondaryHoverBackground':'#454545',
      '--vscode-descriptionForeground':'#b5b5b5', '--vscode-focusBorder':'#007fd4',
      '--vscode-editorWarning-foreground':'#cca700', '--vscode-textCodeBlock-background':'#252526'
    }).forEach(([name,value]) => document.documentElement.style.setProperty(name,value)); true`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1500,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.ok(
      await evaluate(
        "document.querySelector('.inspector').getBoundingClientRect().top >= document.querySelector('.canvas').getBoundingClientRect().bottom",
      ),
      'Desktop inspector spans the width below the map',
    );
    await evaluate("document.querySelector('#keyboard [data-key=q]').focus(); true");
    await key('Enter', 13);
    assert.equal(await evaluate('document.activeElement.id'), 'detail-title');
    await key('Tab', 9);
    assert.equal(await evaluate('document.activeElement.dataset.focusId'), 'detail:q:origin');
    await key('Enter', 13);
    assert.equal(await evaluate('window.smoke.messages.at(-1).type'), 'reveal');
    assert.equal(await evaluate('window.smoke.messages.at(-1).snapshot'), 1);
    await evaluate(
      "document.querySelector('#details details:last-child').open=true; document.querySelector('[data-focus-id=\"detail:q:history:0\"]').click(); true",
    );
    assert.equal(await evaluate('window.smoke.messages.at(-1).target'), 'history:0');
    await evaluate(
      `document.querySelector('#bind-list').open=true; document.querySelector('[data-focus-id="list:mouse4"]').focus(); window.smoke.state.model.entries[1].action='+duck'; window.smoke.state.model.entries[1].meaning=${JSON.stringify(registry.get('+duck').editorial.en)}; window.smoke.state.snapshot=2; window.postMessage(window.smoke.state,'*'); true`,
    );
    await waitFor(
      "document.activeElement.dataset.focusId === 'list:mouse4' && document.activeElement.textContent.includes('+duck')",
    );
    assert.ok(
      await evaluate("document.querySelector('#keyboard svg') === window.originalKeyboard"),
      'Selection and snapshots preserve SVG geometry',
    );
    await key(' ', 32);
    assert.equal(await evaluate('document.activeElement.id'), 'detail-title');
    await evaluate(`document.querySelector('[data-focus-id="list:CUSTOM"]').click(); true`);
    assert.equal(
      await evaluate("document.querySelector('#details pre').textContent"),
      'echo <img src=x onerror=alert(1)>',
    );
    assert.equal(await evaluate('document.querySelectorAll("img").length'), 0);
    assert.equal(
      await evaluate('document.querySelector(\'[data-focus-id="list:mouse4"] kbd\').textContent'),
      'mouse4',
    );
    assert.equal(
      await evaluate(
        'document.querySelector(\'[data-focus-id="list:mouse4"] .bind-command\').textContent',
      ),
      '+duck',
    );
    assert.ok(
      await evaluate(
        'document.querySelector(\'[data-focus-id="list:mouse4"] .bind-name\').textContent.length > 0',
      ),
    );
    assert.equal(
      await evaluate("document.querySelector('.file-identity code').textContent"),
      'synthetic.cfg',
    );
    assert.equal(
      await evaluate("document.querySelector('#file').title"),
      'tests/fixtures/synthetic.cfg',
    );
    assert.equal(await evaluate("document.querySelector('.file-icon').textContent"), 'CFG');
    const shot = async (name) => {
      await evaluate('window.scrollTo(0,0); true');
      const picture = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
      });
      fs.writeFileSync(path.join(output, name), Buffer.from(picture.data, 'base64'));
    };
    await shot('desktop.png');
    await evaluate(
      "document.querySelector('#category').click(); document.querySelector('#category-menu [data-value=movement]').click(); document.querySelector('#category').click(); true",
    );
    await shot('category-menu.png');
    await evaluate("document.querySelector('#category-menu [data-value=all]').click(); true");
    // Review light and high-contrast reference themes as well as the initial dark theme.
    for (const [name, values] of [
      [
        'light',
        ['#ffffff', '#222222', '#eeeeee', '#222222', '#444444', '#005fb8', '#795e00', '#f3f3f3'],
      ],
      [
        'high-contrast',
        ['#000000', '#ffffff', '#000000', '#ffffff', '#ffffff', '#ffff00', '#ffff00', '#000000'],
      ],
      [
        'high-contrast-light',
        ['#ffffff', '#000000', '#ffffff', '#000000', '#000000', '#0000aa', '#7a2900', '#ffffff'],
      ],
    ]) {
      await evaluate(
        `['--vscode-editor-background','--vscode-editor-foreground','--vscode-button-secondaryBackground','--vscode-button-secondaryForeground','--vscode-descriptionForeground','--vscode-focusBorder','--vscode-editorWarning-foreground','--vscode-textCodeBlock-background'].forEach((key,index) => document.documentElement.style.setProperty(key,${JSON.stringify(values)}[index])); true`,
      );
      await shot(`${name}.png`);
    }
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1050,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.ok(await evaluate('document.documentElement.scrollWidth <= 1050'));
    assert.ok(
      await evaluate(
        "document.querySelector('.inspector').getBoundingClientRect().top >= document.querySelector('.canvas').getBoundingClientRect().bottom",
      ),
    );
    assert.equal(await evaluate("document.querySelector('#filter-panel').open"), true);
    assert.equal(
      await evaluate(
        "Math.round(document.querySelector('#keyboard svg').getBoundingClientRect().width)",
      ),
      1080,
    );
    await shot('medium.png');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 724,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(100);
    await evaluate("document.querySelector('#filter-panel').open=true");
    await waitFor("document.querySelector('#category').getBoundingClientRect().height > 0");
    assert.ok(
      await evaluate(
        "Math.abs(document.querySelector('#category').getBoundingClientRect().top - document.querySelector('#state-filter').getBoundingClientRect().top) < 1",
      ),
      'Category and State align at 724px',
    );
    assert.ok(
      await evaluate(
        "Math.abs(document.querySelector('#category-label').getBoundingClientRect().top - document.querySelector('#state-label').getBoundingClientRect().top) < 1",
      ),
      'Filter labels align at 724px',
    );
    await shot('filters-724.png');
    await evaluate("document.querySelector('#filter-panel').open=false");
    await evaluate("window.smoke.state.pt=true; window.postMessage(window.smoke.state,'*'); true");
    await waitFor("document.documentElement.lang === 'pt-BR'");
    await send('Emulation.setDeviceMetricsOverride', {
      width: 420,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.ok(
      await evaluate('document.documentElement.scrollWidth <= 420'),
      'Narrow viewport has no horizontal overflow',
    );
    assert.equal(
      await evaluate(
        "Math.round(document.querySelector('#keyboard svg').getBoundingClientRect().width)",
      ),
      1080,
      'Narrow views preserve readable key scale',
    );
    assert.ok(
      await evaluate(
        "document.querySelector('#keyboard').scrollWidth > document.querySelector('#keyboard').clientWidth",
      ),
      'Only the keyboard region scrolls horizontally',
    );
    await waitFor("document.querySelector('#filter-panel').open === false");
    await evaluate("document.querySelector('#filter-panel').open = true");
    assert.ok(
      await evaluate(
        "Math.abs(document.querySelector('#category').getBoundingClientRect().top - document.querySelector('#state-filter').getBoundingClientRect().top) < 1",
      ),
      'Narrow filter controls align',
    );
    assert.ok(
      await evaluate(
        "Math.abs(document.querySelector('#category').getBoundingClientRect().height - document.querySelector('#state-filter').getBoundingClientRect().height) < 1",
      ),
      'Narrow filter heights match',
    );
    await evaluate("document.querySelector('#filter-panel').open = false");
    assert.ok(
      await evaluate(
        "document.querySelector('.inspector').getBoundingClientRect().top >= document.querySelector('.canvas').getBoundingClientRect().bottom",
      ),
    );
    await evaluate("document.querySelector('#keyboard [data-key=kp_enter]').focus(); true");
    assert.ok(
      await evaluate("document.querySelector('#keyboard').scrollLeft > 0"),
      'Focusing an offscreen key reveals it inside the scroll region',
    );
    await key('Enter', 13);
    assert.equal(await evaluate("document.querySelector('#details h3').textContent"), 'Enter');
    await evaluate("document.querySelector('#keyboard').scrollLeft=0; true");
    await shot('narrow.png');
    // Task-oriented review matrix: preserve keyboard scale, mouse shape and selected inspector.
    for (const [theme, values] of [
      [
        'dark',
        ['#1e1e1e', '#cccccc', '#333333', '#ffffff', '#aaaaaa', '#0098ff', '#cca700', '#252526'],
      ],
      [
        'light',
        ['#ffffff', '#222222', '#eeeeee', '#222222', '#444444', '#005fb8', '#795e00', '#f3f3f3'],
      ],
    ]) {
      await evaluate(
        `['--vscode-editor-background','--vscode-editor-foreground','--vscode-button-secondaryBackground','--vscode-button-secondaryForeground','--vscode-descriptionForeground','--vscode-focusBorder','--vscode-editorWarning-foreground','--vscode-textCodeBlock-background'].forEach((key,index)=>document.documentElement.style.setProperty(key,${JSON.stringify(values)}[index])); true`,
      );
      for (const width of [1500, 1050, 420]) {
        await send('Emulation.setDeviceMetricsOverride', {
          width,
          height: 1050,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await delay(100);
        await evaluate(
          `document.querySelector('#mouse [data-key=mouse4]').dispatchEvent(new MouseEvent('click',{bubbles:true}));document.querySelector('#keyboard').scrollLeft=0;window.scrollTo(0,0);true`,
        );
        assert.equal(
          await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),
          true,
          `${theme} ${width} page fits`,
        );
        assert.ok(
          await evaluate(`document.querySelector('#details').textContent.includes('+duck')`),
          'Selected action remains readable',
        );
        await shot(`${theme}-${width}.png`);
      }
    }
    await evaluate(
      "window.smoke.state.source='other.cfg'; window.smoke.state.snapshot=3; window.postMessage(window.smoke.state,'*'); true",
    );
    await waitFor("document.querySelector('#details pre') === null");
    await evaluate(
      "window.postMessage({type:'state',source:'',snapshot:4,pt:false,file:'',unavailable:true},'*'); true",
    );
    await waitFor("document.querySelectorAll('#list button').length === 0");
    assert.deepEqual(await evaluate('window.smoke.violations'), []);
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(output, 'report.json'),
      JSON.stringify(
        {
          browser: await send('Browser.getVersion'),
          checks: [
            'real DOM',
            'CSP',
            'literal content',
            'Enter/Space/Tab',
            'focus after updates',
            'source switch',
            'source close',
            'English/pt-BR',
            'narrow layout',
            'fixed keyboard scale and local horizontal scrolling at narrow/medium widths',
            'offscreen key focus, responsive inspector and single-assignment history suppression',
            'reference dark/light/high-contrast themes',
            'SVG geometry, idle selection, mouse selection, filters and history navigation',
            'category listbox keyboard interaction, palette consistency and focus across snapshots',
            'literal keycaps, registry action descriptions and file identity badge',
          ],
          scope:
            'Standalone Chromium with a simulated VS Code bridge; not Extension Host or game validation.',
        },
        null,
        2,
      ),
    );
    console.log(`PASS: Bind map browser smoke. Screenshots and report: ${output}`);
    // Some Chromium builds close the socket before replying to Browser.close.
    socket.send(JSON.stringify({ id: ++id, method: 'Browser.close' }));
    await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1500)]);
  } finally {
    for (const item of pending.values()) clearTimeout(item.timer);
    socket?.close();
    if (child.exitCode === null) child.kill();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
