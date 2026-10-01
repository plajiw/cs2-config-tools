const crypto = require('node:crypto');
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function parseDump(text, kind) {
  if (!['convar', 'command'].includes(kind)) throw new Error('Invalid dump kind');
  const entries = [];
  let current;
  for (const [index, line] of text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .entries()) {
    if (!line.trim()) continue;
    if (/^\s/.test(line)) {
      if (!current) throw new Error(`Orphan help at line ${index + 1}`);
      current.help.push(line.trim());
      continue;
    }
    const header = line.match(/^(\S+)(?: (.*))? \(([^()]*)\)$/);
    if (
      !header ||
      (kind === 'convar' && header[2] === undefined) ||
      (kind === 'command' && header[2] !== undefined)
    )
      throw new Error(`Unrecognized ${kind} header at line ${index + 1}: ${line}`);
    const bounds = {};
    const flags = [];
    for (const part of header[3].split(',').map((part) => part.trim())) {
      const bound = part.match(/^(min|max):\s*(\S+)$/);
      const enumeration = part.match(/^enum:\s*(\w+)$/);
      if (bound) {
        const number = Number(bound[2]);
        if (!Number.isFinite(number) || bounds[bound[1]] !== undefined)
          throw new Error(`Invalid bounds: ${header[1]}`);
        bounds[bound[1]] = number;
      } else if (enumeration) {
        if (bounds.enumName) throw new Error(`Duplicate enum: ${header[1]}`);
        bounds.enumName = enumeration[1];
      } else if (part) {
        if (!/^[\w ]+$/.test(part)) throw new Error(`Invalid flags: ${header[1]}`);
        flags.push(...part.split(/\s+/));
      }
    }
    if (bounds.min !== undefined && bounds.max !== undefined && bounds.min > bounds.max)
      throw new Error(`Inverted bounds: ${header[1]}`);
    current = {
      name: header[1],
      kind,
      flags,
      ...bounds,
      help: [],
      ...(kind === 'convar' ? { dumpValue: header[2] } : {}),
    };
    entries.push(current);
  }
  if (!entries.length) throw new Error(`Empty ${kind} dump`);
  const names = new Set();
  return entries.map(({ help, ...entry }) => {
    if (names.has(entry.name)) throw new Error(`Duplicate symbol: ${entry.name}`);
    names.add(entry.name);
    const description = help.filter((line) => line !== '<no description>').join('\n');
    return { ...entry, description: description || null };
  });
}

function validateSnapshot(snapshot) {
  if (
    snapshot.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(snapshot.revision ?? '') ||
    snapshot.repository !== 'SteamTracking/GameTracking-CS2' ||
    !Array.isArray(snapshot.entries) ||
    !snapshot.entries.length
  )
    throw new Error('Invalid Source 2 snapshot');
  const names = new Set();
  for (const kind of ['convar', 'command']) {
    const source = snapshot.sources?.[kind];
    const file = `DumpSource2/${kind === 'convar' ? 'convars' : 'commands'}.txt`;
    if (
      source?.path !== file ||
      !/^[a-f0-9]{64}$/.test(source.sha256 ?? '') ||
      source.url !==
        `https://raw.githubusercontent.com/${snapshot.repository}/${snapshot.revision}/${file}`
    )
      throw new Error(`Invalid ${kind} provenance`);
  }
  for (const entry of snapshot.entries) {
    if (
      !entry.name ||
      /\s/.test(entry.name) ||
      names.has(entry.name) ||
      !['convar', 'command'].includes(entry.kind) ||
      !Array.isArray(entry.flags) ||
      entry.flags.some((flag) => !/^[\w]+$/.test(flag)) ||
      new Set(entry.flags).size !== entry.flags.length ||
      (entry.enumName !== undefined && !/^\w+$/.test(entry.enumName)) ||
      (entry.description !== null && typeof entry.description !== 'string') ||
      (entry.kind === 'convar' && typeof entry.dumpValue !== 'string') ||
      (entry.kind === 'command' && entry.dumpValue !== undefined) ||
      ['min', 'max'].some((key) => entry[key] !== undefined && !Number.isFinite(entry[key])) ||
      (entry.min !== undefined && entry.max !== undefined && entry.min > entry.max)
    )
      throw new Error(`Invalid or duplicate symbol: ${entry.name}`);
    names.add(entry.name);
  }
  return snapshot;
}

function diffSnapshots(previous, next) {
  const before = new Map((previous?.entries ?? []).map((entry) => [entry.name, entry]));
  const after = new Map(next.entries.map((entry) => [entry.name, entry]));
  const changes = {
    from: previous?.revision ?? null,
    to: next.revision,
    added: [],
    missing: [],
    changed: [],
  };
  for (const [name, entry] of after) {
    const old = before.get(name);
    if (!old) changes.added.push({ name, kind: entry.kind });
    else {
      const fields = {};
      for (const key of ['kind', 'dumpValue', 'flags', 'min', 'max', 'enumName', 'description'])
        if (JSON.stringify(old[key]) !== JSON.stringify(entry[key]))
          fields[key] = { before: old[key] ?? null, after: entry[key] ?? null };
      if (Object.keys(fields).length) changes.changed.push({ name, kind: entry.kind, fields });
    }
  }
  for (const [name, entry] of before)
    if (!after.has(name)) changes.missing.push({ name, kind: entry.kind });
  return changes;
}

function reportMarkdown(diff) {
  const lines = [
    '# CS2 catalog update',
    '',
    `Revision: ${diff.from ?? '(initial import)'} → ${diff.to}`,
    '',
    'Missing means absent from this snapshot, not removed from the game.',
    '',
    '| Kind | Added | Missing | Metadata changed |',
    '| --- | --- | --- | --- |',
  ];
  for (const kind of ['convar', 'command'])
    lines.push(
      `| ${kind} | ${diff.added.filter((e) => e.kind === kind).length} | ${diff.missing.filter((e) => e.kind === kind).length} | ${diff.changed.filter((e) => e.kind === kind).length} |`,
    );
  lines.push(
    '',
    `Candidates requiring review: ${diff.added.length + diff.missing.length + diff.changed.length}`,
    '',
    '## Changes',
    '',
  );
  for (const change of diff.changed) {
    lines.push(`### ${change.name}`, '');
    for (const [field, value] of Object.entries(change.fields))
      lines.push(`- ${field}: ${JSON.stringify(value.before)} → ${JSON.stringify(value.after)}`);
    lines.push('');
  }
  lines.push(
    '## Added',
    '',
    ...diff.added.map((e) => `- ${e.kind}: ${e.name}`),
    '',
    '## Missing',
    '',
    ...diff.missing.map((e) => `- ${e.kind}: ${e.name}`),
    '',
  );
  return lines.join('\n');
}
module.exports = { parseDump, validateSnapshot, diffSnapshots, reportMarkdown, sha256 };
