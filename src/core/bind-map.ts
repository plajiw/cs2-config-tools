import { EffectiveConfig } from './effective';

export interface BindMapLocation {
  start: number;
  end: number;
}
export interface BindMapEntry {
  key: string;
  action: string;
  certain: boolean;
  origin: BindMapLocation;
  definition: BindMapLocation;
  changes: { kind: 'overwritten' | 'redundant'; origin: BindMapLocation }[];
}
export interface BindMapModel {
  entries: BindMapEntry[];
  partial: boolean;
  limits: { code: string; name?: string }[];
}

/** Presentation data only: deferred actions remain literal, with no second evaluator. */
export function bindMapModel(state: EffectiveConfig): BindMapModel {
  const location = ({ start, end }: BindMapLocation): BindMapLocation => ({ start, end });
  return {
    entries: [...state.binds].map(([key, value]) => ({
      key,
      action: value.value,
      certain: value.certain,
      origin: location(value.invocation ?? value.statement),
      definition: location(value.statement),
      changes: state.bindChanges
        .filter((change) => change.key === key)
        .map((change) => ({
          kind: change.kind,
          origin: location(change.previous.invocation ?? change.previous.statement),
        })),
    })),
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
      target: 'origin' | 'definition' | number;
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
      (Number.isSafeInteger(message.target) && (message.target as number) >= 0))
  );
}
