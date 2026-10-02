// Real Extension Development Host captures; never uses the personal editor profile.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  fs.mkdirSync(path.join(root, '.test-output'), { recursive: true });
  const output = fs.mkdtempSync(path.join(root, '.test-output', 'bind-map-host-'));
  const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/autoexec.cfg'), 'utf8');
  fs.writeFileSync(
    path.join(output, 'visual.cfg'),
    fixture +
      '\n// Synthetic additions for visual validation only\nbind mouse1 +attack\nbind mouse2 +attack2\nbind mouse3 player_ping\nbind mouse4 +voicerecord\nbind mouse5 +jump\nbind mwheelup +jump\nbind mwheeldown +jump\nbind q slot1\nbind q slot2\nexec unresolved-visual.cfg\n',
  );
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  const exe =
    process.env.CS2_CFG_VSCODE || path.join(root, '.cache/vscode-release-test/1.96.4/Code.exe');
  const env = { ...process.env, CS2_BIND_VISUAL_OUTPUT: output };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(
    exe,
    [
      '--disable-gpu',
      '--disable-extension',
      'vscode.git',
      '--skip-welcome',
      '--skip-release-notes',
      '--disable-workspace-trust',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${path.join(output, 'profile')}`,
      `--extensions-dir=${path.join(output, 'extensions')}`,
      `--extensionDevelopmentPath=${root}`,
      `--extensionTestsPath=${path.join(root, 'tests/integration/bind-map-visual.cjs')}`,
    ],
    { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let log = '';
  child.stdout.on('data', (data) => {
    log += data;
  });
  child.stderr.on('data', (data) => {
    log += data;
  });
  let socket;
  const pending = new Map();
  try {
    for (let i = 0; i < 600 && !fs.existsSync(path.join(output, 'ready')); i++) {
      if (child.exitCode !== null) throw new Error(log);
      await delay(100);
    }
    assert.ok(fs.existsSync(path.join(output, 'ready')), 'Host opened the actual Bind Map');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const target = targets.find((t) => t.type === 'page' && /workbench/.test(t.url));
    assert.ok(target, JSON.stringify(targets));
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    let id = 0;
    const contexts = [];
    const attachedTargets = new Set();
    socket.addEventListener('message', (event) => {
      const result = JSON.parse(event.data),
        item = pending.get(result.id);
      if (result.method === 'Runtime.executionContextCreated')
        contexts.push({ contextId: result.params.context.id, sessionId: result.sessionId });
      if (!item) return;
      pending.delete(result.id);
      clearTimeout(item.timer);
      result.error
        ? item.reject(new Error(JSON.stringify(result.error)))
        : item.resolve(result.result);
    });
    const send = (method, params = {}, sessionId) =>
      new Promise((resolve, reject) => {
        const request = ++id;
        const timer = setTimeout(() => {
          pending.delete(request);
          reject(new Error(method + ' timed out'));
        }, 10000);
        pending.set(request, { resolve, reject, timer });
        socket.send(
          JSON.stringify({ id: request, method, params, ...(sessionId ? { sessionId } : {}) }),
        );
      });
    await send('Runtime.enable');
    let selectedContext;
    for (let attempt = 0; attempt < 50 && !selectedContext; attempt++) {
      const { targetInfos } = await send('Target.getTargets');
      for (const info of targetInfos.filter(
        (t) => ['page', 'iframe', 'webview'].includes(t.type) && t.targetId !== target.id,
      )) {
        if (attachedTargets.has(info.targetId)) continue;
        attachedTargets.add(info.targetId);
        const attached = await send('Target.attachToTarget', {
          targetId: info.targetId,
          flatten: true,
        });
        await send('Runtime.enable', {}, attached.sessionId);
      }
      for (const context of contexts) {
        try {
          const result = await send(
            'Runtime.evaluate',
            {
              expression:
                'typeof document !== "undefined" && !!document.querySelector("#keyboard svg")',
              contextId: context.contextId,
              returnByValue: true,
            },
            context.sessionId,
          );
          if (result.result?.value) {
            selectedContext = context;
            break;
          }
        } catch {}
      }
      if (!selectedContext) await delay(200);
      if (attempt === 49)
        fs.writeFileSync(
          path.join(output, 'targets.json'),
          JSON.stringify({ targetInfos, contexts }, null, 2),
        );
    }
    assert.ok(selectedContext, 'Actual extension WebView renderer is reachable');
    const evaluate = async (expression) => {
      const result = await send(
        'Runtime.evaluate',
        { expression, contextId: selectedContext.contextId, returnByValue: true },
        selectedContext.sessionId,
      );
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const measurements = [];
    for (const [name, width] of [
      ['wide', 1920],
      ['medium', 1200],
      ['narrow', 900],
    ]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 1200,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await delay(500);
      await evaluate('window.scrollTo(0,0)');
      const metrics = await evaluate(
        `({width:innerWidth, keyboard:document.querySelector('#keyboard svg').getBoundingClientRect().width, keyboardViewport:document.querySelector('#keyboard').clientWidth, keyboardScroll:document.querySelector('#keyboard').scrollWidth, mouse:document.querySelector('#mouse').getBoundingClientRect().width, overflow:document.documentElement.scrollWidth > innerWidth, canvas:document.querySelector('.canvas').getBoundingClientRect().toJSON(), inspector:document.querySelector('.inspector').getBoundingClientRect().toJSON()})`,
      );
      assert.equal(metrics.overflow, false, name + ' has no document overflow');
      if (name === 'wide')
        assert.ok(
          metrics.keyboardScroll <= metrics.keyboardViewport,
          'Wide keyboard fits without scrolling',
        );
      assert.ok(
        metrics.inspector.top >= metrics.canvas.bottom,
        name + ' inspector is below the devices',
      );
      assert.ok(metrics.mouse >= 230, name + ' mouse has a useful visual size');
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(screenshot.data, 'base64'));
      measurements.push({ name, ...metrics });
    }
    await evaluate(
      `document.querySelector('#mouse [data-key=mouse4]').dispatchEvent(new MouseEvent('click')); window.scrollTo(0,0)`,
    );
    assert.ok(
      await evaluate(`document.querySelector('#details').textContent.includes('voicerecord')`),
      'Real analysis feeds mouse selection',
    );
    for (const [name, width] of [
      ['wide', 1920],
      ['medium', 1200],
      ['narrow', 900],
    ]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 1200,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await delay(500);
      await evaluate("document.querySelector('.inspector').scrollIntoView({block:'end'});");
      const selected = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(
        path.join(output, name + '-selected.png'),
        Buffer.from(selected.data, 'base64'),
      );
    }
    fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
    console.log('PASS: Real Extension Development Host captures: ' + output);
  } finally {
    fs.writeFileSync(path.join(output, 'done'), 'done');
    fs.writeFileSync(path.join(output, 'host.log'), log);
    socket?.close();
    for (const item of pending.values()) clearTimeout(item.timer);
    if (child.exitCode === null) {
      await delay(2000);
      if (child.exitCode === null) child.kill();
    }
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
