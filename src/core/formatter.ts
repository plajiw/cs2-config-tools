import { parse } from './parser';

export interface FormatterOptions {
  eol?: '\n' | '\r\n';
  maxBlankLines?: number;
  separateSections?: boolean;
  insertFinalNewline?: boolean;
}

/** Normalize only whitespace outside literals. Keep echo text and bind/alias bodies intact. */
function formatLine(line: string): string {
  const statements = parse(line).statements.filter((statement) => statement.context === 'top');
  // Unquoted echo arguments are user-facing text, so preserve their spacing too.
  if (statements.some((statement) => statement.tokens[0].value === 'echo')) return line;
  let output = '';
  let quoted = false;
  let pendingSpace = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (!quoted && line.startsWith('//', index)) {
      return output.trimEnd() + (output.trimEnd() ? '  ' : '') + line.slice(index);
    }
    if (!quoted && /[\t ]/.test(character)) {
      pendingSpace = true;
      continue;
    }
    if (!quoted && character === ';') {
      output = output.trimEnd() + ';';
      pendingSpace = true;
      continue;
    }
    if (pendingSpace && output) output += ' ';
    pendingSpace = false;
    output += character;
    if (character === '"') quoted = !quoted;
  }
  return output;
}

export function formatCfg(text: string, options: FormatterOptions = {}): string {
  // Broken strings are left unchanged instead of being repaired by guesswork.
  if (!text || parse(text).issues.length) return text;
  const eol = options.eol ?? (text.includes('\r\n') ? '\r\n' : '\n');
  const maxBlankLines = Math.max(0, Math.min(3, Math.floor(options.maxBlankLines ?? 1)));
  const separateSections = options.separateSections ?? true;
  const insertFinalNewline = options.insertFinalNewline ?? true;
  const hasBom = text.startsWith('\uFEFF');
  const source = hasBom ? text.slice(1) : text;
  const output: string[] = [];
  let pendingBlankLines = 0;
  for (const line of source.split(/\r\n|\n|\r/)) {
    if (!line.trim()) {
      pendingBlankLines++;
      continue;
    }
    const formatted = formatLine(line);
    const sectionHeading = /^\/\/\s*(?:={3,}|-{3,})/.test(formatted);
    const previous = output[output.length - 1];
    if (separateSections && sectionHeading && previous && !previous.startsWith('//'))
      pendingBlankLines = Math.max(1, pendingBlankLines);
    if (output.length) output.push(...Array(Math.min(pendingBlankLines, maxBlankLines)).fill(''));
    pendingBlankLines = 0;
    output.push(formatted);
  }
  if (!output.length) return hasBom ? '\uFEFF' : '';
  const result = (hasBom ? '\uFEFF' : '') + output.join(eol);
  return result + (insertFinalNewline ? eol : '');
}
