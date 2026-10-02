function validateParameter(name, parameter) {
  if (!parameter || !['integer', 'number', 'boolean'].includes(parameter.type))
    throw new Error(`Invalid parameter type: ${name}`);
  for (const key of ['min', 'max'])
    if (parameter[key] !== undefined && !Number.isFinite(parameter[key]))
      throw new Error(`Invalid ${key}: ${name}`);
  if (parameter.min !== undefined && parameter.max !== undefined && parameter.min > parameter.max)
    throw new Error(`Inverted range: ${name}`);
  const valid = (value) => {
    const normalized =
      parameter.type === 'boolean'
        ? value === 'true'
          ? '1'
          : value === 'false'
            ? '0'
            : value
        : value;
    if (
      typeof value !== 'string' ||
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)
    )
      return false;
    const number = Number(normalized);
    return (
      Number.isFinite(number) &&
      (parameter.type !== 'integer' || Number.isInteger(number)) &&
      (parameter.type !== 'boolean' || ['0', '1', 'true', 'false'].includes(value)) &&
      (parameter.min === undefined || number >= parameter.min) &&
      (parameter.max === undefined || number <= parameter.max)
    );
  };
  const values = parameter.values ?? [];
  if (
    !Array.isArray(values) ||
    new Set(values.map((v) => v.value)).size !== values.length ||
    values.some((v) => !valid(v.value) || !v.en || !v['pt-BR'])
  )
    throw new Error(`Invalid enum: ${name}`);
  if (
    parameter.default !== undefined &&
    (!valid(parameter.default) ||
      (values.length && !values.some((v) => v.value === parameter.default)))
  )
    throw new Error(`Invalid default: ${name}`);
}
function validateCatalog(catalog) {
  if (catalog.schemaVersion !== 2 || !catalog.sources || !Array.isArray(catalog.entries))
    throw new Error('Unsupported catalog schema');
  const names = new Set();
  const sources = new Set([
    ...Object.keys(catalog.sources),
    ...Object.values(catalog.sources)
      .map((s) => s.url)
      .filter(Boolean),
  ]);
  for (const entry of catalog.entries) {
    if (
      entry.editorial?.category !== undefined &&
      !['movement', 'weapons', 'grenades', 'communication', 'buy', 'utility', 'interface'].includes(
        entry.editorial.category,
      )
    )
      throw new Error(`Invalid editorial category: ${entry.name}`);
    const meaning = entry.editorial?.meaning;
    if (
      meaning &&
      (typeof meaning.label?.en !== 'string' ||
        !meaning.label.en.trim() ||
        typeof meaning.label?.['pt-BR'] !== 'string' ||
        !meaning.label['pt-BR'].trim() ||
        meaning.semanticKind !== 'inventory-slot' ||
        meaning.confidence !== 'community' ||
        !['high', 'tentative'].includes(meaning.strength) ||
        !sources.has(meaning.source) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(meaning.reviewDate) ||
        typeof meaning.notes !== 'string' ||
        !meaning.notes.trim())
    )
      throw new Error('Invalid human meaning: ' + entry.name);
    if (!entry.name || /\s/.test(entry.name) || names.has(entry.name))
      throw new Error(`Duplicate/invalid identity: ${entry.name}`);
    names.add(entry.name);
    if (
      !['command', 'convar', 'unknown'].includes(entry.kind) ||
      !['discovered', 'verified', 'curated'].includes(entry.catalogStatus) ||
      !['active', 'deprecated', 'legacy', 'removed', 'unknown'].includes(entry.lifecycle)
    )
      throw new Error(`Invalid status: ${entry.name}`);
    if (entry.documentation?.reviewed && (!entry.editorial?.en || !entry.editorial['pt-BR']))
      throw new Error(`Missing translation: ${entry.name}`);
    if (entry.parameter) validateParameter(entry.name, entry.parameter);
    validateConstraintSources(entry, catalog);
    for (const evidence of Object.values(entry.provenance ?? {}))
      if (
        !sources.has(evidence.source) ||
        !['community', 'snapshot-verified'].includes(evidence.confidence)
      )
        throw new Error(`Invalid evidence: ${entry.name}`);
    if (
      entry.technical &&
      (!catalog.sources[entry.technical.sourceId] || entry.technical.kind !== entry.kind)
    )
      throw new Error(`Invalid technical reference: ${entry.name}`);
    if (
      (entry.sources ?? []).some((id) => !catalog.sources[id]) ||
      (entry.reportedRejection && !catalog.sources[entry.reportedRejection])
    )
      throw new Error(`Unknown source: ${entry.name}`);
  }
  const byName = new Map(catalog.entries.map((e) => [e.name, e]));
  for (const entry of catalog.entries) {
    const visited = new Set([entry.name]);
    let next = entry.compatibility?.replacement;
    while (next) {
      if (!names.has(next) || visited.has(next))
        throw new Error(`Invalid compatibility reference: ${entry.name}`);
      visited.add(next);
      next = byName.get(next).compatibility?.replacement;
    }
  }
  return catalog;
}

function validateConstraintSources(entry, catalog) {
  const technical = entry.technical,
    parameter = entry.parameter;
  const fail = () => {
    throw new Error(`Conflicting parameter constraints: ${entry.name}`);
  };
  if (technical) {
    if (
      ['min', 'max'].some(
        (key) => technical[key] !== undefined && !Number.isFinite(technical[key]),
      ) ||
      (technical.min !== undefined && technical.max !== undefined && technical.min > technical.max)
    )
      fail();
    if (
      technical.values !== undefined &&
      (!Array.isArray(technical.values) ||
        !technical.values.length ||
        technical.values.some((value) => typeof value !== 'string') ||
        new Set(technical.values).size !== technical.values.length ||
        entry.provenance?.['technical.values']?.source !== technical.sourceId)
    )
      throw new Error(`Invalid technical enum evidence: ${entry.name}`);
  }
  if (!parameter) return;
  const scope = parameter.scope;
  if (scope) {
    if (
      typeof scope.buildId !== 'string' ||
      !scope.buildId.trim() ||
      scope.reviewed !== true ||
      !catalog.sources[scope.source] ||
      catalog.sources[scope.source].buildId !== scope.buildId ||
      (technical && !entry.runtime?.gameBuild)
    )
      throw new Error(`Unresolved parameter scope: ${entry.name}`);
    if (scope.buildId !== entry.runtime?.gameBuild) return;
  }
  if (!technical) return;
  // A curated subset is valid; a conflicting widening is not an implicit override.
  if (
    (parameter.min !== undefined && technical.min !== undefined && parameter.min < technical.min) ||
    (parameter.max !== undefined && technical.max !== undefined && parameter.max > technical.max)
  )
    fail();
  const min = parameter.min ?? technical.min,
    max = parameter.max ?? technical.max;
  if (min !== undefined && max !== undefined && min > max) fail();
  const normalized = (value) => (value === 'true' ? 1 : value === 'false' ? 0 : Number(value));
  const valid = (value) => {
    const number = normalized(value);
    return (
      Number.isFinite(number) &&
      (min === undefined || number >= min) &&
      (max === undefined || number <= max) &&
      (!technical.values || technical.values.some((option) => normalized(option) === number))
    );
  };
  if (
    (parameter.default !== undefined && !valid(parameter.default)) ||
    parameter.values?.some((option) => !valid(option.value))
  )
    fail();
}
module.exports = { validateParameter, validateCatalog };
