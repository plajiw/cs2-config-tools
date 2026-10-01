import { CommandRegistry } from '../catalog/registry';
import { parse, Parsed, Statement } from './parser';
import { parameterFindings } from './parameters';

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
}

/** Single-file symbolic analysis, never game execution. Unknown effects invalidate prior state. */
export function effectiveConfig(
  parsed: Parsed,
  registry: CommandRegistry,
  budget = 1000,
): EffectiveConfig {
  const result: EffectiveConfig = {
    assignments: new Map(),
    binds: new Map(),
    aliases: new Map(),
    history: [],
    bindChanges: [],
    limits: [],
    complete: true,
  };
  let remaining = budget;
  const limit = (code: AnalysisLimit['code'], statement?: Statement) => {
    result.complete = false;
    result.limits.push({ code, statement, name: statement?.tokens[0].value });
    for (const map of [result.assignments, result.binds, result.aliases])
      for (const value of map.values()) value.certain = false;
  };
  if (parsed.issues.length) {
    limit('syntax');
    return result;
  }
  const execute = (statements: Statement[], stack: string[] = [], invocation?: Statement) => {
    for (const statement of statements) {
      if (--remaining < 0) {
        limit('budget', statement);
        return;
      }
      const [command, arg, body] = statement.tokens;
      const name = command.value;
      if (
        (['bind', 'alias'].includes(name) && statement.tokens.length > 3) ||
        (name === 'unbind' && statement.tokens.length !== 2) ||
        (name === 'unbindall' && statement.tokens.length !== 1)
      ) {
        limit('dynamic', statement);
        continue;
      }
      const alias = result.aliases.get(name);
      if (alias) {
        if (!alias.certain) {
          limit('dynamic', statement);
          continue;
        }
        if (stack.includes(name) || stack.length >= 16) {
          limit('alias-cycle', statement);
          continue;
        }
        const expanded = parse(
          alias.value,
          alias.statement.tokens[2]?.contentStart ?? alias.statement.end,
        );
        if (expanded.issues.length) limit('syntax', statement);
        else
          execute(
            expanded.statements.filter((s) => s.context === 'top'),
            [...stack, name],
            invocation ?? statement,
          );
        continue;
      }
      if (name === 'alias' && arg) {
        if (body) {
          result.aliases.set(arg.value, {
            value: body.value,
            statement,
            certain: true,
            invocation,
          });
          result.history.push({
            kind: 'alias',
            name: arg.value,
            value: body.value,
            statement,
            invocation,
          });
        }
      } else if (name === 'bind' && arg) {
        if (body) {
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
        }
      } else if (name === 'unbind' && arg) {
        result.binds.delete(arg.value);
        result.history.push({ kind: 'unbind', name: arg.value, statement, invocation });
      } else if (name === 'unbindall') {
        result.binds.clear();
        result.history.push({ kind: 'unbindall', name: '*', statement, invocation });
      } else if (registry.get(name)?.kind === 'convar') {
        if (arg && statement.tokens.length === 2) {
          const valid =
            parameterFindings({ statements: [statement], issues: [] }, registry).length === 0;
          if (!valid) limit('dynamic', statement);
          result.assignments.set(name, { value: arg.value, statement, certain: valid, invocation });
          result.history.push({
            kind: 'assignment',
            name,
            value: arg.value,
            statement,
            invocation,
          });
        } else if (arg) limit('dynamic', statement);
      } else if (name === 'exec' || name === 'execifexists') limit('exec', statement);
      else if (!['echo', 'alias', 'bind'].includes(name)) limit('dynamic', statement);
    }
  };
  execute(parsed.statements.filter((statement) => statement.context === 'top'));
  return result;
}
