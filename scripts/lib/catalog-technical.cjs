const { validateSnapshot } = require('./source2.cjs');
function technicalSources(snapshot) {
  validateSnapshot(snapshot);
  return Object.fromEntries(
    Object.entries(snapshot.sources).map(([kind, source]) => [
      `source2-${snapshot.revision}-${kind}`,
      {
        ...source,
        type: 'source2-runtime-dump',
        title: 'Source 2 runtime dump via SteamTracking/GameTracking-CS2',
        repository: snapshot.repository,
        revision: snapshot.revision,
        snapshotDate: snapshot.snapshotDate,
        buildId: snapshot.gameBuild,
        review: snapshot.review ?? null,
      },
    ]),
  );
}
function attachTechnical(entry, technical, snapshot) {
  const human = Boolean(entry.editorial.en);
  const provenance = {
    ...(human
      ? {
          'editorial.en': { source: 'project-curation', confidence: 'community' },
          'editorial.pt-BR': { source: 'project-curation', confidence: 'community' },
        }
      : {}),
    ...(entry.documentationSource
      ? Object.fromEntries(
          Object.keys(entry.parameter ?? {}).map((field) => [
            `parameter.${field}`,
            { source: entry.documentationSource.url, confidence: 'community' },
          ]),
        )
      : {}),
  };
  if (!technical)
    return {
      ...entry,
      catalogStatus: human ? 'curated' : 'discovered',
      lifecycle: 'unknown',
      documentation: { reviewed: human },
      provenance,
    };
  const source = `source2-${snapshot.revision}-${technical.kind}`;
  for (const field of ['kind', 'flags', 'dumpValue', 'min', 'max', 'enumName', 'description'])
    if (technical[field] !== undefined && technical[field] !== null)
      provenance[`technical.${field}`] = { source, confidence: 'snapshot-verified' };
  provenance['runtime.present'] = { source, confidence: 'snapshot-verified' };
  for (const field of ['kind', 'rawFlags'])
    provenance[field] = { source, confidence: 'snapshot-verified' };
  if (technical.description)
    provenance['original.text'] = { source, confidence: 'snapshot-verified' };
  return {
    ...entry,
    kind: technical.kind,
    catalogStatus: human ? 'curated' : 'verified',
    lifecycle: 'unknown',
    documentation: { reviewed: human },
    provenance,
    sources: [...(entry.sources ?? []), source, ...(human ? ['project-curation'] : [])],
    runtime: {
      present: true,
      revision: snapshot.revision,
      gameBuild: snapshot.gameBuild,
      verifiedInGame: false,
    },
    technical: { ...technical, sourceId: source },
    original: technical.description ? { text: technical.description } : entry.original,
    // Runtime permission is not guaranteed merely because a dump advertises a flag.
    rawFlags: technical.flags,
    requiresCheats: technical.flags.includes('cheat') ? 'flagged' : 'unknown',
  };
}
module.exports = { technicalSources, attachTechnical };
