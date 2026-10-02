const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function run() {
  const root = path.resolve(__dirname, '..');
  const executable =
    process.env.CS2_CFG_VSCODE ||
    path.join(process.env.LOCALAPPDATA, 'Programs/Microsoft VS Code/Code.exe');
  if (!fs.existsSync(executable))
    throw new Error('Set CS2_CFG_VSCODE to a local VS Code executable');
  fs.mkdirSync(path.join(root, '.test-output'), { recursive: true });
  const output = fs.mkdtempSync(path.join(root, '.test-output', 'integration-'));
  const env = { ...process.env, CS2_CFG_TEST_OUTPUT: output };
  delete env.ELECTRON_RUN_AS_NODE;
  const stdout = fs.createWriteStream(path.join(output, 'vscode.stdout.log'));
  const stderr = fs.createWriteStream(path.join(output, 'vscode.stderr.log'));
  console.log(`Integration run: ${output}`);
  const child = spawn(
    executable,
    [
      '--disable-gpu',
      '--disable-workspace-trust',
      `--extensions-dir=${path.join(output, 'extensions')}`,
      `--user-data-dir=${path.join(output, 'profile')}`,
      `--extensionDevelopmentPath=${process.env.CS2_CFG_EXTENSION_PATH || root}`,
      `--extensionTestsPath=${path.join(root, 'tests/integration/index.cjs')}`,
    ],
    { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let text = '',
    timedOut = false,
    rejectTimeout;
  const recordOut = (data) => {
    text += data;
    stdout.write(data);
  };
  const recordError = (data) => stderr.write(data);
  child.stdout.on('data', recordOut);
  child.stderr.on('data', recordError);
  const deadline = new Promise((_, reject) => {
    rejectTimeout = reject;
  });
  const timer = setTimeout(() => {
    timedOut = true;
    rejectTimeout(new Error('VS Code integration timed out; retained per-run logs'));
    // The ChildProcess identity belongs exclusively to this run.
    try {
      if (!child.kill()) console.error('CLEANUP FAILURE: owned process could not be terminated');
    } catch (error) {
      console.error('CLEANUP FAILURE:', error);
    }
  }, 60000);
  let failure;
  try {
    const code = await Promise.race([
      deadline,
      new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', resolve);
      }),
    ]);
    if (timedOut) throw new Error('VS Code integration timed out; retained per-run logs');
    if (code !== 0) throw new Error(`VS Code integration exited with ${code}; see ${output}`);
    if (!text.includes('PASS: Extension Host integration'))
      throw new Error('Integration tests did not report success');
  } catch (error) {
    failure = error;
  } finally {
    clearTimeout(timer);
    child.stdout.removeListener('data', recordOut);
    child.stderr.removeListener('data', recordError);
    if (timedOut) {
      child.stdout.destroy();
      child.stderr.destroy();
      child.unref();
    }
    await Promise.all([
      new Promise((resolve) => stdout.end(resolve)),
      new Promise((resolve) => stderr.end(resolve)),
    ]);
  }
  fs.writeFileSync(
    path.join(output, 'result.txt'),
    failure ? `FAIL: ${failure.stack}` : 'PASS: Extension Host integration',
  );
  if (failure) throw failure;
  console.log(
    text
      .split(/\r?\n/)
      .filter((line) => line.startsWith('PASS:'))
      .join('\n'),
  );
}
run().catch((error) => {
  console.error('PRIMARY FAILURE:', error);
  process.exitCode = 1;
});
