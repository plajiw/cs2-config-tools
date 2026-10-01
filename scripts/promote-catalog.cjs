const fs = require('node:fs');
const path = require('node:path');
const { parseDump, validateSnapshot, sha256 } = require('./lib/source2.cjs');
const root = path.resolve(__dirname, '..');
try {
  const snapshot = validateSnapshot(
    JSON.parse(fs.readFileSync(path.join(root, 'catalog/candidates/index.json'), 'utf8')),
  );
  const index = process.argv.indexOf('--reviewed');
  if (index === -1 || process.argv[index + 1] !== snapshot.revision)
    throw new Error(
      'Review the diff first, then use catalog:promote -- --reviewed <exact candidate SHA>.',
    );
  const entries = [];
  for (const kind of ['convar', 'command']) {
    const text = fs.readFileSync(path.join(root, `catalog/candidates/${kind}s.txt`), 'utf8');
    if (sha256(text) !== snapshot.sources[kind].sha256) throw new Error(`Changed raw ${kind} dump`);
    entries.push(...parseDump(text, kind));
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  if (JSON.stringify(entries) !== JSON.stringify(snapshot.entries))
    throw new Error('Candidates differ from raw evidence');
  const reviewed = {
    ...snapshot,
    catalogStatus: 'verified',
    review: {
      revision: snapshot.revision,
      scope: 'technical snapshot only; no runtime or human-documentation verification',
    },
  };
  fs.writeFileSync(
    path.join(root, 'catalog/source/technical.json'),
    JSON.stringify(reviewed, null, 2) + '\n',
  );
  console.log('Technical source promoted. Run npm run catalog and review the generated artifact.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
