import { CommandRegistry } from '../catalog/registry';
import { Parsed, Statement } from './parser';
import { resolveOrderedAliases, AliasResolution } from './ordered-aliases';
import { parameterFinding } from './parameter-value';

export interface StateValue {
  value: string;
  statement: Statement;
  certain: boolean;
  invocation?: Statement;
}
export interface BindChange {
  kind: 'overwritten' | 'redundant';
  key: string;
  previous: StateValue;
  current: StateValue;
}
export interface StateEvent {
  kind: 'assignment' | 'bind' | 'unbind' | 'unbindall' | 'alias';
  name: string;
  value?: string;
  statement: Statement;
  invocation?: Statement;
}
export interface AnalysisLimit {
  code: 'syntax' | 'exec' | 'dynamic' | 'alias-cycle' | 'budget';
  name?: string;
  statement?: Statement;
}
export interface EffectiveConfig {
  assignments: Map<string, StateValue>;
  binds: Map<string, StateValue>;
  aliases: Map<string, StateValue>;
  history: StateEvent[];
  bindChanges: BindChange[];
  limits: AnalysisLimit[];
  complete: boolean;
  aliasResolution: AliasResolution;
}

/** Single-file symbolic analysis, never game execution. Unknown effects invalidate prior state. */
export function effectiveConfig(
  parsed: Parsed,
  registry: CommandRegistry,
  budget = 1000,
): EffectiveConfig {
  const resolution = resolveOrderedAliases(parsed, registry, budget);
  const result: EffectiveConfig = {
    aliasResolution: resolution,
    assignments: new Map(),
    binds: new Map(),
    aliases: new Map(),
    history: [],
    bindChanges: [],
    limits: [],
    complete: true,
  };
  for (const step of resolution.steps) {
    if (step.kind === 'limit') {
      result.complete = false;
      result.limits.push(step.limit);
      for (const map of [result.assignments, result.binds, result.aliases])
        for (const value of map.values()) value.certain = false;
      continue;
    }
    const { statement, invocation } = step;
    const [command, arg, body] = statement.tokens;
    const name = command.value;
    if (name === 'alias' && arg && body) {
      result.aliases.set(arg.value, { value: body.value, statement, certain: true, invocation });
      result.history.push({
        kind: 'alias',
        name: arg.value,
        value: body.value,
        statement,
        invocation,
      });
    } else if (name === 'bind' && arg && body) {
      const previous = result.binds.get(arg.value);
      const current: StateValue = { value: body.value, statement, certain: true, invocation };
      if (previous?.certain)
        result.bindChanges.push({
          kind: previous.value === current.value ? 'redundant' : 'overwritten',
          key: arg.value,
          previous: { ...previous },
          current: { ...current },
        });
      result.binds.set(arg.value, current);
      result.history.push({
        kind: 'bind',
        name: arg.value,
        value: body.value,
        statement,
        invocation,
      });
    } else if (name === 'unbind' && arg) {
      result.binds.delete(arg.value);
      result.history.push({ kind: 'unbind', name: arg.value, statement, invocation });
    } else if (name === 'unbindall') {
      result.binds.clear();
      result.history.push({ kind: 'unbindall', name: '*', statement, invocation });
    } else if (registry.get(name)?.kind === 'convar' && arg && statement.tokens.length === 2) {
      const valid = !parameterFinding(statement, registry);
      result.assignments.set(name, { value: arg.value, statement, certain: valid, invocation });
      result.history.push({ kind: 'assignment', name, value: arg.value, statement, invocation });
    }
  }
  return result;
}
