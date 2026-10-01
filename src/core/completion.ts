import { parse, atOffset, Parsed } from './parser';

export interface CompletionContext {
  name?: string;
  argumentIndex: number;
  prefix: string;
  start: number;
  end: number;
}
export function completionContext(
  text: string,
  parsed: Parsed,
  offset: number,
): CompletionContext | undefined {
  const hit = atOffset(parsed, offset);
  if (hit && !(hit.index === 2 && ['bind', 'alias'].includes(hit.statement.tokens[0].value))) {
    if (hit.statement.tokens[0].value === 'echo' && hit.index > 0) return undefined;
    return {
      name: hit.statement.tokens[0].value,
      argumentIndex: hit.index,
      prefix: text.slice(hit.token.contentStart, offset),
      start: hit.token.contentStart,
      end: hit.token.contentEnd,
    };
  }
  const lineStart =
    Math.max(text.lastIndexOf('\n', offset - 1), text.lastIndexOf('\r', offset - 1)) + 1;
  // Find an enclosing body, then scan its current statement respecting quotes and comments.
  const body = parsed.statements
    .flatMap((s) => (['bind', 'alias'].includes(s.tokens[0].value) ? [s.tokens[2]] : []))
    .find((t) => t && offset >= t.contentStart && offset <= t.contentEnd);
  const start = body ? body.contentStart : lineStart;
  const prefixText = text.slice(start, offset);
  let quote = false,
    lastSeparator = 0;
  for (let i = 0; i < prefixText.length; i++) {
    if (prefixText[i] === '"') quote = !quote;
    if (!quote && prefixText.startsWith('//', i)) return undefined;
    if (!quote && /[;\r\n]/.test(prefixText[i])) lastSeparator = i + 1;
  }
  const local = parse(prefixText.slice(lastSeparator), start + lastSeparator);
  const s = local.statements.find((s) => s.context === 'top');
  if (s?.tokens[0].value === 'echo') return undefined;
  return {
    name: s?.tokens[0].value,
    argumentIndex: s?.tokens.length ?? 0,
    prefix: '',
    start: offset,
    end: offset,
  };
}
