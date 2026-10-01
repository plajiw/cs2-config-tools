export interface Token {
  value: string;
  start: number;
  end: number;
  contentStart: number;
  contentEnd: number;
  quoted: boolean;
}
export interface Statement {
  tokens: Token[];
  start: number;
  end: number;
  context: 'top' | 'bind' | 'alias';
  parentStart?: number;
}
export interface Trivia {
  kind: 'whitespace' | 'comment' | 'separator';
  start: number;
  end: number;
}
export interface Issue {
  start: number;
  end: number;
  code: string;
}
export interface Parsed {
  statements: Statement[];
  issues: Issue[];
  source?: string;
  trivia?: Trivia[];
}

/** Corpus grammar: literal quoted text, // comments outside strings, ; and newline separators.
 * Backslash escapes are intentionally not inferred from JSON or shell grammar. */
export function parse(
  text: string,
  base = 0,
  context: Statement['context'] = 'top',
  depth = 0,
  parentStart?: number,
): Parsed {
  const result: Parsed = { statements: [], issues: [], source: text, trivia: [] };
  let tokens: Token[] = [],
    i = 0;
  const flush = () => {
    if (!tokens.length) return;
    const statement: Statement = {
      tokens,
      start: tokens[0].start,
      end: tokens[tokens.length - 1].end,
      context,
      ...(parentStart === undefined ? {} : { parentStart }),
    };
    result.statements.push(statement);
    const name = tokens[0].value;
    if ((name === 'bind' || name === 'alias') && tokens[2]?.quoted && depth < 8) {
      const body = tokens[2];
      const nested = parse(body.value, body.contentStart, name, depth + 1, statement.start);
      result.statements.push(...nested.statements);
      result.issues.push(...nested.issues);
      result.trivia!.push(...nested.trivia!);
    }
    tokens = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (c === ';' || c === '\r' || c === '\n') {
      flush();
      result.trivia!.push({ kind: 'separator', start: base + i, end: base + i + 1 });
      i++;
      continue;
    }
    if (/\s/.test(c)) {
      const start = i++;
      while (i < text.length && /\s/.test(text[i]) && !/[\r\n]/.test(text[i])) i++;
      result.trivia!.push({ kind: 'whitespace', start: base + start, end: base + i });
      continue;
    }
    if (text.startsWith('//', i)) {
      flush();
      const start = i;
      while (i < text.length && text[i] !== '\n') i++;
      result.trivia!.push({ kind: 'comment', start: base + start, end: base + i });
      continue;
    }
    const start = i,
      quoted = c === '"';
    if (quoted) {
      i++;
      const contentStart = i;
      while (i < text.length && text[i] !== '"' && text[i] !== '\r' && text[i] !== '\n') i++;
      const contentEnd = i;
      if (text[i] === '"') i++;
      else
        result.issues.push({
          start: base + start,
          end: base + Math.max(start + 1, i),
          code: 'unterminated-string',
        });
      tokens.push({
        value: text.slice(contentStart, contentEnd),
        start: base + start,
        end: base + i,
        contentStart: base + contentStart,
        contentEnd: base + contentEnd,
        quoted,
      });
    } else {
      while (i < text.length && !/[\s;"]/.test(text[i]) && !text.startsWith('//', i)) i++;
      tokens.push({
        value: text.slice(start, i),
        start: base + start,
        end: base + i,
        contentStart: base + start,
        contentEnd: base + i,
        quoted,
      });
    }
  }
  flush();
  return result;
}

export function aliases(parsed: Parsed): Map<string, { token: Token; body: string }> {
  const map = new Map<string, { token: Token; body: string }>();
  for (const s of parsed.statements)
    if (s.context === 'top' && s.tokens[0].value === 'alias' && s.tokens[1] && s.tokens[2]) {
      map.set(s.tokens[1].value, { token: s.tokens[1], body: s.tokens[2]?.value ?? '' });
    }
  return map;
}

export function atOffset(
  parsed: Parsed,
  offset: number,
): { statement: Statement; token: Token; index: number } | undefined {
  // Prefer nested statements over the enclosing bind/alias string.
  for (const s of [...parsed.statements].reverse()) {
    const index = s.tokens.findIndex((t) => offset >= t.contentStart && offset <= t.contentEnd);
    if (index >= 0) return { statement: s, token: s.tokens[index], index };
  }
  return undefined;
}

/** Resolve immediate uses against preceding definitions; deferred uses stay document-scoped. */
export function aliasAt(
  parsed: Parsed,
  name: string,
  offset: number,
  deferred = false,
): { token: Token; body: string } | undefined {
  let found: { token: Token; body: string } | undefined;
  for (const statement of parsed.statements) {
    if (
      statement.context !== 'top' ||
      statement.tokens[0].value !== 'alias' ||
      statement.tokens[1]?.value !== name ||
      !statement.tokens[2]
    )
      continue;
    if (!deferred && statement.start > offset) continue;
    found = { token: statement.tokens[1], body: statement.tokens[2]?.value ?? '' };
  }
  return found;
}
