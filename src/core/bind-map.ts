import { EffectiveConfig } from './effective';
import { CommandRegistry } from '../catalog/registry';
import { parse } from './parser';

export interface BindMapLocation {
  start: number;
  end: number;
  line?: number;
}
export interface BindMapEntry {
  key: string;
  action: string;
  certain: boolean;
  meaning?: string;
  category: string;
  conflict: boolean;
  raw?: string;
  history: { action: string; raw?: string; origin: BindMapLocation; effective: boolean }[];
  origin: BindMapLocation;
  definition: BindMapLocation;
  changes: { kind: 'overwritten' | 'redundant'; origin: BindMapLocation }[];
}
export interface BindMapModel {
  mode: 'read';
  entries: BindMapEntry[];
  partial: boolean;
  limits: { code: string; name?: string }[];
}

/** Presentation data only: deferred actions remain literal, with no second evaluator. */
export function bindMapModel(
  state: EffectiveConfig,
  context?: { registry: CommandRegistry; source: string; language: 'en' | 'pt-BR' },
): BindMapModel {
  const lines = [0];
  if (context)
    for (let i = 0; i < context.source.length; i++)
      if (context.source[i] === '\n') lines.push(i + 1);
  const location = ({ start, end }: BindMapLocation): BindMapLocation => {
    let low = 0,
      high = lines.length;
    while (low + 1 < high) {
      const mid = (low + high) >>> 1;
      if (lines[mid] <= start) low = mid;
      else high = mid;
    }
    return { start, end, ...(context ? { line: low + 1 } : {}) };
  };
  const raw = ({ start, end }: BindMapLocation) => context?.source.slice(start, end);
  return {
    mode: 'read',
    entries: [...state.binds].map(([key, value]) => {
      const body = parse(value.value);
      const top = body.statements.filter((statement) => statement.context === 'top');
      const name = top.length === 1 && !body.issues.length ? top[0].tokens[0].value : undefined;
      const command = name && !state.aliases.has(name) ? context?.registry.get(name) : undefined;
      const events = state.history.filter((event) => event.kind === 'bind' && event.name === key);
      let active = [] as typeof events;
      for (const event of state.history) {
        if (event.kind === 'unbindall' || (event.kind === 'unbind' && event.name === key))
          active = [];
        else if (event.kind === 'bind' && event.name === key) active.push(event);
      }
      return {
        key,
        action: value.value,
        certain: value.certain,
        category: command?.editorial.category ?? 'custom',
        meaning:
          command?.editorial[context?.language ?? 'en'] || command?.editorial.en || undefined,
        conflict: state.bindChanges.some(
          (change) =>
            change.key === key &&
            change.kind === 'overwritten' &&
            active.some(
              (event) =>
                event.statement === change.current.statement &&
                event.invocation === change.current.invocation,
            ),
        ),
        raw: raw(value.statement),
        history: events.map((event, index) => ({
          action: event.value!,
          raw: raw(event.statement),
          origin: location(event.invocation ?? event.statement),
          effective: index === events.length - 1,
        })),
        origin: location(value.invocation ?? value.statement),
        definition: location(value.statement),
        changes: state.bindChanges
          .filter((change) => change.key === key)
          .map((change) => ({
            kind: change.kind,
            origin: location(change.previous.invocation ?? change.previous.statement),
          })),
      };
    }),
    partial: !state.complete,
    limits: state.limits.map(({ code, name }) => ({ code, name })),
  };
}

export type BindMapMessage =
  | { type: 'ready' }
  | {
      type: 'reveal';
      snapshot: number;
      version: number;
      entry: number;
      target: 'origin' | 'definition' | number | `history:${number}`;
    };

/** Reject arbitrary commands, paths, offsets and malformed messages at the host boundary. */
export function isBindMapMessage(value: unknown): value is BindMapMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  if (message.type === 'ready') return Object.keys(message).length === 1;
  return (
    message.type === 'reveal' &&
    Object.keys(message).length === 5 &&
    Number.isSafeInteger(message.snapshot) &&
    (message.snapshot as number) > 0 &&
    Number.isSafeInteger(message.version) &&
    Number.isSafeInteger(message.entry) &&
    (message.entry as number) >= 0 &&
    (message.target === 'origin' ||
      message.target === 'definition' ||
      (typeof message.target === 'string' &&
        /^history:\d+$/.test(message.target) &&
        Number.isSafeInteger(Number(message.target.slice(8)))) ||
      (Number.isSafeInteger(message.target) && (message.target as number) >= 0))
  );
}
