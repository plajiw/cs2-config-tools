import { CommandRegistry } from '../catalog/registry';
import { EffectiveConfig } from './effective';
import { healthReport } from './health';
import { Parsed } from './parser';

export interface ConfigurationSource {
  id: 'game-cfg' | 'steam-userdata';
  kind: 'game-cfg' | 'steam-userdata';
  path?: string;
  connected: boolean;
  writable: boolean;
}

/** Names are hints, not proof of authorship or that the game manages a file. */
export function configFileOrigin(name: string, typical: boolean): 'user' | 'game' | 'unknown' {
  if (/^(autoexec|practice|binds|aliases|crosshair|radar)\.cfg$/i.test(name)) return 'user';
  if (typical && /^(gamemode_|gamemap_|server(?:_|\.))/i.test(name)) return 'game';
  return 'unknown';
}

export interface ConfigSummary {
  binds: number;
  settings: number;
  aliases: number;
  findings: number;
  partial: boolean;
  errors: number;
  warnings: number;
  information: number;
  crosshair: boolean;
  radar: boolean;
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
    errors: report.findings.filter((finding) => finding.severity === 'error').length,
    warnings: report.findings.filter((finding) => finding.severity === 'warning').length,
    information: report.findings.filter((finding) => finding.severity === 'information').length,
    crosshair: parsed.statements.some(
      (statement) =>
        statement.context === 'top' &&
        statement.tokens.length > 1 &&
        statement.tokens[0].value.startsWith('cl_crosshair'),
    ),
    radar: parsed.statements.some(
      (statement) =>
        statement.context === 'top' &&
        statement.tokens.length > 1 &&
        statement.tokens[0].value.startsWith('cl_radar'),
    ),
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

export type HubAction = 'open' | 'bindMap' | 'health' | 'delete';
export type HubMessage =
  | {
      type:
        | 'ready'
        | 'connect'
        | 'choose'
        | 'detect'
        | 'refresh'
        | 'disconnect'
        | 'new'
        | 'revealFolder'
        | 'connectSettings'
        | 'detectSettings'
        | 'disconnectSettings'
        | 'video'
        | 'rawVideo'
        | 'openVideo'
        | 'revealSettings'
        | 'savedControls'
        | 'explorer'
        | 'builder';
    }
  | { type: HubAction; revision: number; file: string };

export function isHubMessage(value: unknown): value is HubMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  if (
    [
      'ready',
      'connect',
      'choose',
      'detect',
      'refresh',
      'disconnect',
      'new',
      'revealFolder',
      'connectSettings',
      'detectSettings',
      'disconnectSettings',
      'video',
      'rawVideo',
      'openVideo',
      'revealSettings',
      'savedControls',
      'explorer',
      'builder',
    ].includes(String(message.type))
  )
    return Object.keys(message).length === 1;
  return (
    ['open', 'bindMap', 'health', 'delete'].includes(String(message.type)) &&
    Object.keys(message).length === 3 &&
    Number.isSafeInteger(message.revision) &&
    Number(message.revision) > 0 &&
    typeof message.file === 'string' &&
    validCfgName(message.file)
  );
}
