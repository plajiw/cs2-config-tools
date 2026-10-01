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
module.exports = { validateParameter, validateCatalog };
