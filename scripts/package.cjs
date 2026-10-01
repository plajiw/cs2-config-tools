const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts');
fs.mkdirSync(output, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    require.resolve('@vscode/vsce/vsce'),
    'package',
    '--allow-missing-repository',
    '--no-rewrite-relative-links',
    '--out',
    output,
  ],
  { cwd: root, stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
