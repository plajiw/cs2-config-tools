import { Statement } from '../core/parser';
import { execFilename } from './paths';

/** Each request owns deduplication and at most four filesystem operations. */
export async function resolveDocumentLinks<T>(
  statements: readonly Statement[],
  cancelled: () => boolean,
  resolve: (statement: Statement) => Promise<T | undefined>,
): Promise<{ statement: Statement; target: T }[]> {
  const groups = new Map<string, Statement[]>();
  for (const statement of statements) {
    if (cancelled()) return [];
    if (statement.tokens[0].value !== 'exec' || !statement.tokens[1]) continue;
    const key = execFilename(statement.tokens[1].value);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(statement);
    groups.set(key, group);
  }
  const queue = [...groups.values()],
    result: { statement: Statement; target: T }[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (!cancelled() && next < queue.length) {
        const group = queue[next++];
        const target = await resolve(group[0]);
        if (cancelled()) return;
        if (target) for (const statement of group) result.push({ statement, target });
      }
    }),
  );
  return cancelled() ? [] : result.sort((a, b) => a.statement.start - b.statement.start);
}
