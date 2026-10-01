import { CommandRegistry } from '../catalog/registry';

function distance(left: string, right: string, maximum: number): number {
  let row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let index = 0; index < left.length; index++) {
    const next = [index + 1];
    for (let column = 0; column < right.length; column++)
      next.push(
        Math.min(
          next[column] + 1,
          row[column + 1] + 1,
          row[column] + (left[index] === right[column] ? 0 : 1),
        ),
      );
    if (Math.min(...next) > maximum) return maximum + 1;
    row = next;
  }
  return row[right.length];
}
/** Suggestions are explicit token edits, never inferred command migrations. */
export function closestSymbols(name: string, registry: CommandRegistry): string[] {
  if (name.length < 3 || name.length > 128 || registry.get(name)) return [];
  return registry
    .suggestions()
    .filter((entry) => Math.abs(entry.name.length - name.length) <= 2)
    .map((entry) => ({ name: entry.name, distance: distance(name, entry.name, 2) }))
    .filter((entry) => entry.distance <= 2)
    .sort((a, b) => a.distance - b.distance || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .slice(0, 3)
    .map((entry) => entry.name);
}
