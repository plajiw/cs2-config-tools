import { CommandRegistry, applicableParameter } from '../catalog/registry';
import { parse } from './parser';
import { effectiveConfig } from './effective';
import { parameterFindings } from './parameters';
import { humanMeaning, actionMeaning, supportsActionMeaning } from './human-meaning';

export interface BindAction {
  command: string;
  parameters: string[];
}
export interface BindChange {
  key: string;
  action: BindAction;
  replace: boolean;
}
export interface SourceEdit {
  start: number;
  end: number;
  text: string;
}
export interface BindPreview {
  source: string;
  result: string;
  edits: SourceEdit[];
  errors: string[];
  warnings: string[];
  human: { key: string; before: string; after: string }[];
  raw: string;
}

/** Bounded MVP inputs, not a claim to enumerate every game-supported key. */
export const bindKeys = [
  ...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''),
  ...Array.from({ length: 12 }, (_, i) => `f${i + 1}`),
  'space',
  'tab',
  'escape',
  'enter',
  'backspace',
  'shift',
  'ctrl',
  'alt',
  'uparrow',
  'downarrow',
  'leftarrow',
  'rightarrow',
  'ins',
  'del',
  'home',
  'end',
  'pgup',
  'pgdn',
  'capslock',
  'pause',
  '`',
  '-',
  '=',
  '[',
  ']',
  '\\',
  ',',
  '.',
  '/',
  ...Array.from({ length: 5 }, (_, i) => `mouse${i + 1}`),
  'mwheelup',
  'mwheeldown',
  'kp_0',
  'kp_1',
  'kp_2',
  'kp_3',
  'kp_4',
  'kp_5',
  'kp_6',
  'kp_7',
  'kp_8',
  'kp_9',
  'kp_del',
  'kp_divide',
  'kp_multiply',
  'kp_minus',
  'kp_plus',
  'kp_enter',
];

export function searchBindActions(
  registry: CommandRegistry,
  query: string,
  language: 'en' | 'pt-BR',
) {
  const needle = query.trim().toLowerCase();
  return registry
    .suggestions()
    .filter(
      (entry) =>
        (entry.kind !== 'unknown' || entry.documentation.reviewed) &&
        entry.lifecycle !== 'removed' &&
        !['bind', 'unbind', 'unbindall', 'alias', 'exec'].includes(entry.name),
    )
    .map((entry) => {
      const meaning = humanMeaning(entry, language);
      return {
        command: entry.name,
        label: meaning.title || entry.name,
        description: meaning.description,
        category: meaning.category,
        parameter: applicableParameter(entry),
        confidence: meaning.evidence?.strength,
      };
    })
    .filter(
      (item) =>
        !needle ||
        `${item.command} ${item.label} ${item.description}`.toLowerCase().includes(needle),
    )
    .sort(
      (a, b) =>
        Number(!a.confidence) - Number(!b.confidence) ||
        Number(a.category === 'custom') - Number(b.category === 'custom') ||
        a.category.localeCompare(b.category) ||
        a.command.localeCompare(b.command),
    )
    .slice(0, 100);
}

/** Inner quotes/escapes are deliberately unsupported by the corpus grammar. */
export function serializeAction(action: BindAction): string {
  if (
    !/^[+\-\w]+$/.test(action.command) ||
    action.parameters.some((p) => !p || /[\s";\\]|\/\//.test(p))
  )
    throw new Error('unsafe-action');
  return [action.command, ...action.parameters].join(' ');
}

export function applySourceEdits(source: string, edits: SourceEdit[]): string {
  let result = source;
  let boundary = source.length;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > boundary)
      throw new Error('overlapping-edits');
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    boundary = edit.start;
  }
  return result;
}

/** A preview is an immutable source snapshot; cancel has no side effects. */
export function previewBinds(
  source: string,
  changes: BindChange[],
  registry: CommandRegistry,
  language: 'en' | 'pt-BR' = 'en',
): BindPreview {
  const preview: BindPreview = {
    source,
    result: source,
    edits: [],
    errors: [],
    warnings: [],
    human: [],
    raw: '',
  };
  if (source.length > 1_000_000) {
    preview.errors.push('malformed-or-large-source');
    return preview;
  }
  const parsed = parse(source);
  const state = effectiveConfig(parsed, registry);
  if (source.length > 1_000_000 || parsed.issues.length)
    preview.errors.push('malformed-or-large-source');
  if (!changes.length || changes.length > 100) preview.errors.push('empty-or-large-change');
  if (state.aliases.has('bind')) preview.errors.push('alias-shadow:bind');
  if (!state.complete) preview.warnings.push('partial-source');
  const seen = new Set<string>();
  const additions: string[] = [];
  const raw: string[] = [];
  const describe = (action: string) => {
    const body = parse(action);
    const entry =
      body.statements.length === 1 ? registry.get(body.statements[0].tokens[0].value) : undefined;
    const meaning = actionMeaning(
      body.issues.length ? undefined : entry,
      body.statements[0]?.tokens.slice(1).map((token) => token.value) ?? [],
      language,
    );
    if (meaning.evidence?.strength === 'tentative') return action;
    return meaning.label || (meaning.description ? `${meaning.description} · ${action}` : action);
  };
  for (const change of changes) {
    const key = change.key.toLowerCase();
    if (!bindKeys.includes(key)) preview.errors.push('invalid-key:' + key);
    if (seen.has(key)) preview.errors.push('duplicate-key:' + key);
    seen.add(key);
    let action: string;
    try {
      action = serializeAction(change.action);
    } catch {
      preview.errors.push('unsafe-action:' + key);
      continue;
    }
    const entry = registry.get(change.action.command);
    if (
      !entry ||
      (entry.kind === 'unknown' && !entry.documentation.reviewed) ||
      entry.lifecycle === 'removed' ||
      ['bind', 'unbind', 'unbindall', 'alias', 'exec'].includes(entry.name)
    )
      preview.errors.push('unavailable-command:' + change.action.command);
    if (state.aliases.has(change.action.command))
      preview.errors.push('alias-shadow:' + change.action.command);
    if (entry) {
      if (!supportsActionMeaning(entry, change.action.parameters))
        preview.errors.push('slot-arguments:' + key);
      if (entry.kind === 'convar' && change.action.parameters.length !== 1)
        preview.errors.push('argument-count:' + key);
      if (parameterFindings(parse(action), registry).length)
        preview.errors.push('invalid-parameter:' + key);
      if (!entry.editorial.meaning && entry.kind !== 'convar')
        preview.warnings.push('unknown-signature:' + entry.name);
      if (entry.kind === 'convar' && !applicableParameter(entry))
        preview.warnings.push('unknown-parameter:' + entry.name);
      if (!entry.runtime?.verifiedInGame)
        preview.warnings.push('not-runtime-verified:' + entry.name);
      if (
        entry.requiresCheats === 'flagged' ||
        entry.rawFlags?.some((flag) =>
          ['hidden', 'developmentonly', 'internal', 'cheat'].includes(flag),
        )
      )
        preview.warnings.push('restricted-command:' + entry.name);
      if (entry.reportedRejection || ['deprecated', 'legacy'].includes(entry.lifecycle))
        preview.warnings.push('review-availability:' + entry.name);
    }
    const matches = [...state.binds].filter(([name]) => name.toLowerCase() === key);
    const previous = matches.at(-1)?.[1];
    if (previous && !change.replace) preview.errors.push('replace-required:' + key);
    if (matches.length > 1) preview.errors.push('ambiguous-key:' + key);
    // Never edit inside an alias definition or an expanded invocation. Append an explicit override.
    const target =
      previous?.certain && !previous.invocation && previous.statement.context === 'top'
        ? previous.statement.tokens[2]
        : undefined;
    if (target && target.value !== action) {
      if (!target.quoted && /\s/.test(action))
        preview.edits.push({ start: target.start, end: target.end, text: `"${action}"` });
      else preview.edits.push({ start: target.contentStart, end: target.contentEnd, text: action });
      raw.push(
        '- ' + source.slice(previous!.statement.start, previous!.statement.end),
        '+ ' +
          source.slice(previous!.statement.start, target.start) +
          (target.quoted || /\s/.test(action) ? `"${action}"` : action),
      );
    } else if (!target) {
      const line = `bind "${key}" "${action}"`;
      additions.push(line);
      raw.push('+ ' + line);
      if (previous) preview.warnings.push('append-override:' + key);
    }
    preview.human.push({
      key,
      before: previous ? describe(previous.value) : '',
      after: describe(action),
    });
  }
  if (additions.length) {
    const eol = source.includes('\r\n') ? '\r\n' : '\n';
    const finalNewline = /[\r\n]$/.test(source);
    preview.edits.push({
      start: source.length,
      end: source.length,
      text: (source && !finalNewline ? eol : '') + additions.join(eol) + (finalNewline ? eol : ''),
    });
  }
  if (!preview.errors.length) preview.result = applySourceEdits(source, preview.edits);
  preview.raw = raw.join('\n');
  preview.warnings = [...new Set(preview.warnings)];
  return preview;
}

export function assertFreshPreview(preview: BindPreview, current: string): void {
  if (preview.errors.length || preview.source !== current)
    throw new Error('stale-or-invalid-preview');
}

export type BuilderMessage =
  | { type: 'ready' | 'destination' | 'cancel' | 'rawDiff' }
  | { type: 'search'; query: string }
  | { type: 'preview'; changes: BindChange[] }
  | { type: 'apply'; snapshot: number; acknowledge: boolean };
export function isBuilderMessage(value: unknown): value is BuilderMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const m = value as Record<string, unknown>;
  if (['ready', 'destination', 'cancel', 'rawDiff'].includes(String(m.type)))
    return Object.keys(m).length === 1;
  if (m.type === 'search')
    return Object.keys(m).length === 2 && typeof m.query === 'string' && m.query.length <= 200;
  if (m.type === 'apply')
    return (
      Object.keys(m).length === 3 &&
      Number.isSafeInteger(m.snapshot) &&
      typeof m.acknowledge === 'boolean'
    );
  if (
    m.type !== 'preview' ||
    Object.keys(m).length !== 2 ||
    !Array.isArray(m.changes) ||
    m.changes.length > 100
  )
    return false;
  return m.changes.every(
    (c) =>
      c &&
      typeof c === 'object' &&
      Object.keys(c).length === 3 &&
      typeof c.key === 'string' &&
      c.key.length < 40 &&
      typeof c.replace === 'boolean' &&
      c.action &&
      Object.keys(c.action).length === 2 &&
      typeof c.action.command === 'string' &&
      c.action.command.length < 100 &&
      Array.isArray(c.action.parameters) &&
      c.action.parameters.length <= 16 &&
      c.action.parameters.every((p: unknown) => typeof p === 'string' && p.length < 200),
  );
}
