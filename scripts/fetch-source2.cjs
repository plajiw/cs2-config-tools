const fs = require('node:fs');
const path = require('node:path');
const {
  parseDump,
  validateSnapshot,
  diffSnapshots,
  reportMarkdown,
  sha256,
} = require('./lib/source2.cjs');
const root = path.resolve(__dirname, '..');
const repository = 'SteamTracking/GameTracking-CS2';
async function get(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CS2-Config-Tools' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Source 2 request failed: HTTP ${response.status}`);
  return response;
}
async function main() {
  const revisionIndex = process.argv.indexOf('--revision');
  const requested = revisionIndex === -1 ? null : process.argv[revisionIndex + 1];
  if (revisionIndex !== -1 && !/^[a-f0-9]{40}$/.test(requested ?? ''))
    throw new Error('Use a full revision SHA');
  const commit = await (
    await get(`https://api.github.com/repos/${repository}/commits/${requested ?? 'master'}`)
  ).json();
  if (!/^[a-f0-9]{40}$/.test(commit.sha ?? '')) throw new Error('Invalid upstream revision');
  const snapshot = {
    schemaVersion: 1,
    catalogStatus: 'discovered',
    repository,
    revision: commit.sha,
    snapshotDate: commit.commit.committer.date,
    fetchedAt: new Date().toISOString(),
    gameBuild: null,
    sources: {},
    entries: [],
  };
  const raw = {};
  for (const kind of ['convar', 'command']) {
    const file = `DumpSource2/${kind === 'convar' ? 'convars' : 'commands'}.txt`;
    const url = `https://raw.githubusercontent.com/${repository}/${commit.sha}/${file}`;
    raw[kind] = await (await get(url)).text();
    snapshot.sources[kind] = { path: file, url, sha256: sha256(raw[kind]) };
    snapshot.entries.push(...parseDump(raw[kind], kind));
  }
  snapshot.entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  validateSnapshot(snapshot);
  const baseline = path.join(root, 'catalog/source/technical.json');
  const previous = fs.existsSync(baseline) ? JSON.parse(fs.readFileSync(baseline, 'utf8')) : null;
  const diff = diffSnapshots(previous, snapshot);
  const target = path.join(root, 'catalog/candidates');
  fs.mkdirSync(target, { recursive: true });
  for (const kind of ['convar', 'command'])
    fs.writeFileSync(path.join(target, `${kind}s.txt`), raw[kind]);
  for (const [file, data] of [
    ['index.json', snapshot],
    ['diff.json', diff],
  ])
    fs.writeFileSync(path.join(target, file), JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(path.join(target, 'UPDATE_REPORT.md'), reportMarkdown(diff));
  console.log(`Source 2 candidates: ${snapshot.entries.length} symbols at ${snapshot.revision}.`);
  console.log('Review catalog/candidates/UPDATE_REPORT.md. The published catalog was not changed.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
