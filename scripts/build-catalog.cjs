const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) =>
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, ''));
const inventory = read('catalog/source/inventory.json');
const descriptions = read('catalog/source/descriptions.json');
const packageInfo = read('package.json');
const report = read('catalog/source/console-report.json');
const parameters = read('catalog/source/parameters.json');
const crosshair = read('catalog/source/crosshair.json');
const { technicalSources, attachTechnical } = require('./lib/catalog-technical.cjs');
const { validateCatalog, validateParameter } = require('./lib/validate-catalog.cjs');
const technical = fs.existsSync(path.join(root, 'catalog/source/technical.json'))
  ? read('catalog/source/technical.json')
  : null;
const technicalByName = new Map(technical?.entries.map((entry) => [entry.name, entry]) ?? []);
if (
  technical &&
  (technical.catalogStatus !== 'verified' || technical.review?.revision !== technical.revision)
)
  throw new Error('Technical source must be promoted from a reviewed snapshot.');
for (const key of ['sources', 'commands']) {
  for (const [name, value] of Object.entries(crosshair[key])) {
    if (parameters[key][name] && JSON.stringify(parameters[key][name]) !== JSON.stringify(value))
      throw new Error(`Conflicting ${key}: ${name}`);
    parameters[key][name] = value;
  }
}

const names = new Set([
  ...inventory.nativeCandidates.map((entry) => entry.name),
  ...inventory.commentOnlyCandidates,
  ...Object.keys(descriptions),
  ...Object.keys(parameters.commands),
  ...technicalByName.keys(),
]);
const entries = [...names].sort().map((name) => {
  const editorial = descriptions[name] ?? { en: '' };
  if (descriptions[name] && (!editorial.en || !editorial['pt-BR']))
    throw new Error(`Missing bilingual description: ${name}`);
  const observed = inventory.nativeCandidates.find((entry) => entry.name === name);
  const details = parameters.commands[name];
  const source = details ? parameters.sources[details.sourceId] : undefined;
  if (details && !source) throw new Error(`Unknown documentation source: ${name}`);
  if (details) validateParameter(name, details.parameter);
  if (details?.parameter.values) {
    const values = details.parameter.values;
    if (
      new Set(values.map((value) => value.value)).size !== values.length ||
      values.some((value) => !value.en || !value['pt-BR'])
    )
      throw new Error(`Invalid parameter values: ${name}`);
  }
  const examples = [
    ...new Set(
      (observed?.occurrences ?? []).map((occurrence) => JSON.stringify(occurrence.arguments)),
    ),
  ].map((value) => JSON.parse(value));
  return attachTechnical(
    {
      name,
      kind: 'unknown',
      original: null,
      editorial,
      verification: 'pending',
      requiresCheats: 'unknown',
      examples,
      sources: observed ? ['local-corpus'] : [],
      reportedRejection: report.commands.includes(name) ? report.id : null,
      ...(details
        ? {
            parameter: details.parameter,
            documentationExamples: details.examples,
            documentationSource: source,
            ...(details.compatibility ? { compatibility: details.compatibility } : {}),
            ...(details.rawFlags ? { rawFlags: details.rawFlags } : {}),
          }
        : {}),
    },
    technicalByName.get(name),
    technical,
  );
});

const catalog = {
  schemaVersion: 2,
  version: packageInfo.version,
  buildId: null,
  sources: {
    ...parameters.sources,
    ...(technical ? technicalSources(technical) : {}),
    'project-curation': {
      type: 'community-editorial',
      description: 'Reviewed project explanations and translations.',
    },
    'local-corpus': {
      type: 'user-cfg',
      description: 'Observed syntax only; personal fixtures are excluded from the VSIX.',
    },
    [report.id]: report,
  },
  entries,
};
validateCatalog(catalog);
const output = JSON.stringify(catalog, null, 2) + '\n';
const target = path.join(root, 'catalog/catalog.json');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== output)
    throw new Error('Catalog is stale. Run npm run catalog.');
  console.log('Catalog is up to date.');
} else {
  fs.writeFileSync(target, output);
  console.log('Catalog rebuilt. Snapshot metadata and in-game verification remain distinct.');
}
