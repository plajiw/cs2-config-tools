import { CommandRegistry } from '../catalog/registry';
import { Parsed } from './parser';
import { resolveOrderedAliases, aliasInterpretation, AliasResolution } from './ordered-aliases';
import { parameterFinding } from './parameter-value';
import { Finding } from './diagnostics';

/** Validate only evidenced constraints; queries and unknown signatures are left alone. */
export function parameterFindings(
  parsed: Parsed,
  registry: CommandRegistry,
  resolution: AliasResolution = resolveOrderedAliases(parsed, registry),
): Finding[] {
  const findings: Finding[] = [];
  for (const statement of parsed.statements) {
    if (aliasInterpretation(resolution, statement) !== 'native') continue;
    const finding = parameterFinding(statement, registry);
    if (finding) findings.push(finding);
  }
  return findings;
}
