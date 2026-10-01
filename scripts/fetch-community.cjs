const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const current = process.argv.includes('--current');
if (current) {
  require('./fetch-source2.cjs');
} else {
  const repository = 'ArmynC/ArminC-CS2-Cvars';
  const file = 'cvars/cvarlist.md';
  const headers = { 'User-Agent': 'CS2-Config-Tools', Accept: 'application/vnd.github+json' };

  async function get(url) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Community request failed: HTTP ${response.status}`);
    return response;
  }

  async function main() {
    const commits = await (
      await get(`https://api.github.com/repos/${repository}/commits?path=${file}&per_page=1`)
    ).json();
    const commit = commits[0];
    if (!/^[a-f0-9]{40}$/.test(commit?.sha ?? '')) throw new Error('Invalid upstream revision');
    const url = `https://raw.githubusercontent.com/${repository}/${commit.sha}/${file}`;
    const text = await (await get(url)).text();
    const inventory = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, '../catalog/source/inventory.json'), 'utf8')
        .replace(/^\uFEFF/, ''),
    );
    const names = new Set([
      ...inventory.nativeCandidates.map((entry) => entry.name),
      ...inventory.commentOnlyCandidates,
      ...Object.keys(
        JSON.parse(
          fs
            .readFileSync(path.join(__dirname, '../catalog/source/descriptions.json'), 'utf8')
            .replace(/^\uFEFF/, ''),
        ),
      ),
    ]);
    const entries = [];
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const fields = line.split('|').map((value) => value.trim());
      if (!names.has(fields[0]) || fields.length !== 3) continue;
      entries.push({
        name: fields[0],
        flags: fields[1],
        help: fields[2].replace(/<br\s*\/?>/gi, '\n'),
      });
    }
    if (!entries.length)
      throw new Error('No matching entries; review upstream format before importing.');
    const target = path.join(__dirname, '../.cache/community');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(
      path.join(target, 'candidates.json'),
      JSON.stringify(
        {
          repository,
          revision: commit.sha,
          snapshotDate: commit.commit.committer.date,
          fetchedAt: new Date().toISOString(),
          url,
          sha256: crypto.createHash('sha256').update(text).digest('hex'),
          entries,
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'Community candidates saved to .cache/community/. Review before editing catalog/source/ metadata.',
    );
  }
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
