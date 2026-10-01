import { aliases, Parsed, Issue } from './parser';

export interface Finding extends Issue {
  severity: 'error' | 'warning' | 'information';
  name?: string;
  replacement?: string;
  related?: { start: number; end: number; role: 'previous-bind' | 'bind-definition' }[];
}
export function analyze(
  parsed: Parsed,
  names: Set<string>,
  evidence: ReadonlySet<string> | false,
  compatibility: ReadonlyMap<string, string> = new Map(),
): Finding[] {
  const findings: Finding[] = parsed.issues.map((i) => ({ ...i, severity: 'error' }));
  const locals = aliases(parsed);
  const defined = new Set<string>();
  const nestedDefinitions = new Map<number, Set<string>>();
  for (const s of parsed.statements) {
    const token = s.tokens[0],
      name = token.value;
    const scope =
      s.parentStart === undefined
        ? defined
        : (nestedDefinitions.get(s.parentStart) ?? new Set<string>());
    if (s.parentStart !== undefined) nestedDefinitions.set(s.parentStart, scope);
    const knownAlias =
      s.context === 'top' ? defined.has(name) : locals.has(name) || scope.has(name);
    if (s.context === 'top' && name === 'alias' && s.tokens[1] && s.tokens[2])
      defined.add(s.tokens[1].value);
    if (s.context !== 'top' && name === 'alias' && s.tokens[1] && s.tokens[2])
      scope.add(s.tokens[1].value);
    const replacement = compatibility.get(name);
    if (replacement && !locals.has(name))
      findings.push({
        start: token.contentStart,
        end: token.contentEnd,
        code: 'hidden-compatibility',
        severity: 'information',
        name,
        replacement,
      });
    if (!names.has(name) && !knownAlias)
      findings.push({
        start: token.contentStart,
        end: token.contentEnd,
        code: 'unknown',
        severity: 'information',
        name,
      });
    if (evidence && evidence.has(name))
      findings.push({
        start: token.contentStart,
        end: token.contentEnd,
        code: 'reported-rejection',
        severity: 'warning',
        name,
      });
    if (['bind', 'alias'].includes(name) && s.tokens.length < 2)
      findings.push({
        start: token.start,
        end: token.end,
        code: 'missing-name',
        severity: 'warning',
        name,
      });
  }
  return findings;
}
