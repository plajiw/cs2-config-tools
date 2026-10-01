const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('packaging rejects malformed, duplicate and downgraded releases without changing artifacts', () => {
  const script = fs.readFileSync(path.join(__dirname, '../../scripts/package.cjs'));
  for (const [version, previous, expected] of [
    ['0.0', '0.0.1', /numeric MAJOR.MINOR.PATCH/],
    ['01.0.0', '0.0.1', /numeric MAJOR.MINOR.PATCH/],
    ['0.0.2-beta', '0.0.1', /numeric MAJOR.MINOR.PATCH/],
    ['0.0.2', '0.0.2', /Release already exists/],
    ['0.0.2', '0.0.10', /older than existing release/],
    ['0.9.99', '0.10.0', /older than existing release/],
    ['0.99.99', '1.0.0', /older than existing release/],
  ]) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs2-package-guard-'));
    const scripts = path.join(root, 'scripts');
    const artifacts = path.join(root, 'artifacts');
    fs.mkdirSync(scripts);
    fs.mkdirSync(artifacts);
    const manifest = path.join(root, 'package.json');
    const entry = path.join(scripts, 'package.cjs');
    const artifact = path.join(artifacts, `cs2-config-tools-${previous}.vsix`);
    try {
      fs.writeFileSync(manifest, JSON.stringify({ name: 'cs2-config-tools', version }));
      fs.writeFileSync(entry, script);
      fs.writeFileSync(artifact, 'existing immutable release');
      const result = spawnSync(process.execPath, [entry], { encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, expected);
      assert.equal(fs.readFileSync(artifact, 'utf8'), 'existing immutable release');
      assert.deepEqual(fs.readdirSync(artifacts), [path.basename(artifact)]);
    } finally {
      for (const file of [manifest, entry, artifact]) if (fs.existsSync(file)) fs.unlinkSync(file);
      fs.rmdirSync(scripts);
      fs.rmdirSync(artifacts);
      fs.rmdirSync(root);
    }
  }
});
