import { CommandRegistry } from '../catalog/registry';
import { analyze, Finding } from './diagnostics';
import { effectiveConfig, EffectiveConfig } from './effective';
import { parameterFindings } from './parameters';
import { Parsed } from './parser';
import { bindFindings } from './binds';

export interface HealthReport {
  findings: Finding[];
  state: EffectiveConfig;
  counts: {
    statements: number;
    commands: number;
    convars: number;
    binds: number;
    aliases: number;
    certainAssignments: number;
    bindOverwrites: number;
    redundantBinds: number;
  };
}
/** Health is another consumer of analysis, not a second lint implementation or a game score. */
export function healthReport(
  parsed: Parsed,
  registry: CommandRegistry,
  state = effectiveConfig(parsed, registry),
  evidence: ReadonlySet<string> | false = false,
): HealthReport {
  const findings = [
    ...analyze(
      parsed,
      new Set(registry.entries.keys()),
      evidence,
      new Map(
        registry.catalog.entries
          .filter((entry) => entry.compatibility)
          .map((entry) => [entry.name, entry.compatibility!.replacement]),
      ),
      state.aliasResolution,
    ),
    ...parameterFindings(parsed, registry, state.aliasResolution),
    ...bindFindings(state),
  ];
  const roots = parsed.statements.filter((statement) => statement.context === 'top');
  return {
    findings,
    state,
    counts: {
      statements: roots.length,
      commands: roots.filter(
        (statement) => registry.get(statement.tokens[0].value)?.kind === 'command',
      ).length,
      convars: roots.filter(
        (statement) => registry.get(statement.tokens[0].value)?.kind === 'convar',
      ).length,
      binds: state.binds.size,
      aliases: state.aliases.size,
      certainAssignments: [...state.assignments.values()].filter((value) => value.certain).length,
      bindOverwrites: state.bindChanges.filter((change) => change.kind === 'overwritten').length,
      redundantBinds: state.bindChanges.filter((change) => change.kind === 'redundant').length,
    },
  };
}
