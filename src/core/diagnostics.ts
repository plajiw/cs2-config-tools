import { Parsed, Issue } from './parser';
import { AliasResolution, aliasInterpretation, resolveOrderedAliases } from './ordered-aliases';

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
  resolution: AliasResolution = resolveOrderedAliases(parsed, undefined, 1000, names),
): Finding[] {
  const findings: Finding[] = parsed.issues.map((i) => ({ ...i, severity: 'error' }));
  for (const s of parsed.statements) {
    const token = s.tokens[0],
      name = token.value;
    const knownAlias = aliasInterpretation(resolution, s) !== 'native';
    const replacement = compatibility.get(name);
    if (replacement && !knownAlias)
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
    if (evidence && evidence.has(name) && !knownAlias)
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
  for (const limit of resolution.limits) {
    if (limit.code !== 'alias-cycle' || !limit.statement) continue;
    const token = limit.statement.tokens[0];
    findings.push({
      start: token.contentStart,
      end: token.contentEnd,
      code: 'alias-cycle',
      severity: 'warning',
    });
  }
  return findings;
}
