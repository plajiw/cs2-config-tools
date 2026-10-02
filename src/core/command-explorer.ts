import { CommandRegistry } from '../catalog/registry';

/** Search the shared registry; no parallel command inventory or interpretation. */
export function searchCommands(
  registry: CommandRegistry,
  query: string,
  pt: boolean,
  mode: 'normal' | 'advanced' = 'normal',
  limit = 80,
) {
  const needle = query.trim().toLowerCase();
  return registry
    .suggestions(mode)
    .map((entry) => {
      const description =
        (pt ? entry.editorial['pt-BR'] : entry.editorial.en) || entry.editorial.en || '';
      const rank =
        entry.name === needle
          ? 0
          : entry.name.startsWith(needle)
            ? 1
            : entry.name.includes(needle)
              ? 2
              : 3;
      return { name: entry.name, kind: entry.kind, description, rank };
    })
    .filter(
      (item) =>
        !needle || item.name.includes(needle) || item.description.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .slice(0, limit);
}
