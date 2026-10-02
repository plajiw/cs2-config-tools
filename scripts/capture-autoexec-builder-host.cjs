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
  const output = fs.mkdtempSync(path.join(root, '.test-output', 'autoexec-builder-host-'));
  const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/builder-slots.cfg'), 'utf8');
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
  const env = { ...process.env, CS2_BUILDER_VISUAL_OUTPUT: output };
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
      `--extensionTestsPath=${path.join(root, 'tests/integration/autoexec-builder.cjs')}`,
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
    assert.ok(fs.existsSync(path.join(output, 'ready')), 'Host opened the actual Autoexec Builder');
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
                'typeof document !== "undefined" && !!document.querySelector("#builder #review")',
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
    await delay(400);
    await evaluate(
      "document.querySelector('#key').value='x'; document.querySelector('#search').value='flash'; document.querySelector('#search').dispatchEvent(new Event('input'));",
    );
    await delay(400);
    await evaluate(
      "document.querySelector('#action').value='slot7'; document.querySelector('#add').click(); document.querySelector('#review').click();",
    );
    await delay(500);
    assert.ok(
      await evaluate("document.querySelector('#issues').textContent.includes('Key already bound')"),
      'Conflict blocks unapproved replacement',
    );
    const conflict = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(output, 'conflict.png'), Buffer.from(conflict.data, 'base64'));
    await evaluate(
      "document.querySelector('.replace input').click(); document.querySelector('#review').click();",
    );
    await delay(500);
    assert.ok(
      await evaluate(
        "document.querySelector('#human-diff').textContent.includes('Smoke Grenade') && document.querySelector('#human-diff').textContent.includes('Flashbang')",
      ),
      'Human diff uses shared semantics',
    );
    assert.ok(
      await evaluate("document.querySelector('#raw-diff').textContent.includes('slot7')"),
      'Raw CFG diff is available',
    );
    for (const [name, width] of [
      ['wide', 1920],
      ['medium', 1200],
      ['narrow', 520],
    ]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 1400,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await delay(500);
      await evaluate('window.scrollTo(0,0)');
      const metrics = await evaluate(
        '({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})',
      );
      assert.equal(metrics.overflow, false, name + ' fits');
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(screenshot.data, 'base64'));
      await evaluate("document.querySelector('#preview-section').scrollIntoView({block:'start'})");
      await delay(300);
      const preview = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(
        path.join(output, name + '-preview.png'),
        Buffer.from(preview.data, 'base64'),
      );
      measurements.push({ name, ...metrics });
    }
    await evaluate("document.querySelector('#cancel').click()");
    await delay(300);
    assert.equal(
      fs.readFileSync(path.join(output, 'visual.cfg'), 'utf8'),
      fixture +
        '\n// Synthetic additions for visual validation only\nbind mouse1 +attack\nbind mouse2 +attack2\nbind mouse3 player_ping\nbind mouse4 +voicerecord\nbind mouse5 +jump\nbind mwheelup +jump\nbind mwheeldown +jump\nbind q slot1\nbind q slot2\nexec unresolved-visual.cfg\n',
      'Cancel performs no disk write',
    );
    fs.writeFileSync(path.join(output, 'empty-request'), 'ready');
    for (let i = 0; i < 100 && !fs.existsSync(path.join(output, 'empty-active')); i++)
      await delay(100);
    assert.ok(
      fs.existsSync(path.join(output, 'empty-active')),
      'Builder switched to an empty destination',
    );
    await delay(300);
    await evaluate(
      "document.querySelectorAll('.binding button').forEach(button=>button.click()); window.scrollTo(0,0)",
    );
    const emptyCapture = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(output, 'empty.png'), Buffer.from(emptyCapture.data, 'base64'));
    for (const [key, command, query] of [
      ['w', '+forward', '+forward'],
      ['mouse4', '+attack', '+attack'],
      ['x', 'slot8', 'smoke'],
      ['z', 'slot10', 'incendiary'],
    ]) {
      await evaluate(
        `document.querySelector('#key').value=${JSON.stringify(key)}; document.querySelector('#search').value=${JSON.stringify(query)}; document.querySelector('#search').dispatchEvent(new Event('input'));`,
      );
      for (let i = 0; i < 30; i++) {
        await delay(100);
        if (
          await evaluate(
            `!!document.querySelector('#action option[value=${JSON.stringify(command)}]')`,
          )
        )
          break;
      }
      await evaluate(
        `document.querySelector('#action').value=${JSON.stringify(command)}; document.querySelector('#action').dispatchEvent(new Event('change')); document.querySelector('#add').click();`,
      );
    }
    await evaluate("document.querySelector('#review').click()");
    await delay(500);
    assert.ok(
      await evaluate(
        'document.querySelector(\'#generated\').textContent.includes(\'bind "mouse4" "+attack"\')',
      ),
      'Mouse and common movement actions are generated',
    );
    assert.ok(
      await evaluate(
        "document.querySelector('#human-diff').textContent.includes('Molotov / Incendiary')",
      ),
      'Inventory action search uses human meaning',
    );
    await evaluate("document.querySelector('#preview-section').scrollIntoView({block:'start'})");
    const emptyPreview = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(output, 'empty-preview.png'),
      Buffer.from(emptyPreview.data, 'base64'),
    );
    await evaluate(
      "document.querySelector('#acknowledge').click(); document.querySelector('#apply').click()",
    );
    for (let i = 0; i < 50; i++) {
      await delay(100);
      if (await evaluate("document.querySelector('#status').textContent.startsWith('Applied.')"))
        break;
    }
    assert.ok(
      await evaluate("document.querySelector('#status').textContent.startsWith('Applied.')"),
      'Apply completed through the real WebView bridge',
    );
    assert.equal(
      fs.readFileSync(path.join(output, 'empty-autoexec.cfg'), 'utf8'),
      '',
      'Apply leaves existing disk file unsaved for normal editor recovery',
    );
    fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
    console.log('PASS: Autoexec Builder real Extension Development Host captures: ' + output);
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
