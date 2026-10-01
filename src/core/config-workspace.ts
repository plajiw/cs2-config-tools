import { CommandRegistry } from '../catalog/registry';
import { EffectiveConfig } from './effective';
import { healthReport } from './health';
import { Parsed } from './parser';

export interface ConfigSummary {
  binds: number;
  settings: number;
  aliases: number;
  findings: number;
  partial: boolean;
}

/** Folder totals are sums of independent files, never a simulated combined game state. */
export function configSummary(
  parsed: Parsed,
  registry: CommandRegistry,
  state?: EffectiveConfig,
  evidence: ReadonlySet<string> | false = false,
): ConfigSummary {
  const report = healthReport(parsed, registry, state, evidence);
  return {
    binds: report.counts.binds,
    settings: report.counts.certainAssignments,
    aliases: report.counts.aliases,
    findings: report.findings.length,
    partial: !report.state.complete,
  };
}

export function validCfgName(name: string): boolean {
  return (
    name.length <= 100 &&
    /^[\p{L}\p{N}_-][\p{L}\p{N}_. -]*\.cfg$/iu.test(name) &&
    !name.includes('..') &&
    !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
  );
}

/** Read only Steam library path fields, including the older numbered-string format. */
export function steamLibraryPaths(vdf: string): string[] {
  const paths = [...vdf.matchAll(/"(?:path|\d+)"\s*"((?:\\.|[^"\\])*)"/gi)]
    .map((match) => match[1].replace(/\\\\/g, '\\').replace(/\\"/g, '"'))
    .filter((value) => /^(?:[a-z]:[\\/]|\/|\\\\)/i.test(value));
  return [...new Set(paths)];
}

export type HubAction = 'open' | 'bindMap' | 'health';
export type HubMessage =
  | { type: 'ready' | 'choose' | 'detect' | 'refresh' | 'disconnect' | 'new' | 'revealFolder' }
  | { type: HubAction; revision: number; file: string };

export function isHubMessage(value: unknown): value is HubMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  if (
    ['ready', 'choose', 'detect', 'refresh', 'disconnect', 'new', 'revealFolder'].includes(
      String(message.type),
    )
  )
    return Object.keys(message).length === 1;
  return (
    ['open', 'bindMap', 'health'].includes(String(message.type)) &&
    Object.keys(message).length === 3 &&
    Number.isSafeInteger(message.revision) &&
    Number(message.revision) > 0 &&
    typeof message.file === 'string' &&
    validCfgName(message.file)
  );
}
