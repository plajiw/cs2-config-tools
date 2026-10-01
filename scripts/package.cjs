const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts');
fs.mkdirSync(output, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const numericVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
if (!numericVersion.test(manifest.version)) {
  throw new Error('Release version must use numeric MAJOR.MINOR.PATCH without leading zeros.');
}
const parts = (version) => version.split('.').map(BigInt);
const newer = (left, right) => {
  const a = parts(left),
    b = parts(right);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
};
const prefix = `${manifest.name}-`;
for (const artifact of fs.readdirSync(output)) {
  if (!artifact.startsWith(prefix) || !artifact.endsWith('.vsix')) continue;
  const previous = artifact.slice(prefix.length, -5);
  if (numericVersion.test(previous) && newer(previous, manifest.version)) {
    throw new Error(
      `Release version ${manifest.version} is older than existing release ${previous}. Choose a newer version.`,
    );
  }
}
const filename = `${manifest.name}-${manifest.version}.vsix`;
const destination = path.join(output, filename);
if (fs.existsSync(destination)) {
  throw new Error(
    `Release already exists: ${filename}. Increase the manifest version; existing packages are never overwritten.`,
  );
}
const staging = fs.mkdtempSync(path.join(output, '.package-'));
const stagedPackage = path.join(staging, filename);
try {
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('@vscode/vsce/vsce'),
      'package',
      '--allow-missing-repository',
      '--no-rewrite-relative-links',
      '--out',
      stagedPackage,
    ],
    { cwd: root, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Packaging failed (exit ${result.status}).`);
  // Exclusive creation also protects against a second packaging process racing us.
  fs.copyFileSync(stagedPackage, destination, fs.constants.COPYFILE_EXCL);
  console.log(`Release created: ${destination}`);
} finally {
  if (fs.existsSync(stagedPackage)) fs.unlinkSync(stagedPackage);
  fs.rmdirSync(staging);
}
