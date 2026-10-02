import { CommandRegistry } from '../catalog/registry';
import { aliases, parse, Parsed, Statement } from './parser';
import { parameterFinding } from './parameter-value';

export interface AliasDefinition {
  value: string;
  statement: Statement;
  certain: boolean;
  invocation?: Statement;
}
export interface AliasLimit {
  code: 'syntax' | 'exec' | 'dynamic' | 'alias-cycle' | 'budget';
  statement?: Statement;
  name?: string;
}
export type AliasInterpretation = 'native' | 'alias' | 'uncertain';
export type AliasStep =
  | { kind: 'native'; statement: Statement; invocation?: Statement }
  | { kind: 'limit'; limit: AliasLimit };
export interface AliasResolution {
  aliases: Map<string, AliasDefinition>;
  uses: Map<number, AliasInterpretation[]>;
  deferred: Map<number, AliasInterpretation>;
  steps: AliasStep[];
  limits: AliasLimit[];
}

/** One ordered expansion owner. Native state reducers consume steps, never re-expand aliases. */
export function resolveOrderedAliases(
  parsed: Parsed,
  registry?: CommandRegistry,
  budget = 1000,
  knownNames?: ReadonlySet<string>,
): AliasResolution {
  const result: AliasResolution = {
    aliases: new Map(),
    uses: new Map(),
    deferred: new Map(),
    steps: [],
    limits: [],
  };
  let remaining = budget;
  const limit = (code: AliasLimit['code'], statement?: Statement) => {
    const item = { code, statement, name: statement?.tokens[0].value };
    result.limits.push(item);
    result.steps.push({ kind: 'limit', limit: item });
    for (const alias of result.aliases.values()) alias.certain = false;
  };
  const use = (statement: Statement, kind: AliasInterpretation) => {
    const uses = result.uses.get(statement.start) ?? [];
    uses.push(kind);
    result.uses.set(statement.start, uses);
  };
  const execute = (statements: Statement[], stack: string[] = [], invocation?: Statement) => {
    for (const statement of statements) {
      if (--remaining < 0) {
        limit('budget', statement);
        return;
      }
      const [command, arg, body] = statement.tokens,
        name = command.value;
      const alias = result.aliases.get(name);
      if (alias) {
        use(statement, alias.certain ? 'alias' : 'uncertain');
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
      use(statement, 'native');
      if (
        (['bind', 'alias'].includes(name) && statement.tokens.length > 3) ||
        (name === 'unbind' && statement.tokens.length !== 2) ||
        (name === 'unbindall' && statement.tokens.length !== 1)
      ) {
        limit('dynamic', statement);
        continue;
      }
      result.steps.push({ kind: 'native', statement, invocation });
      if (name === 'alias' && arg && body)
        result.aliases.set(arg.value, { value: body.value, statement, certain: true, invocation });
      else if (['bind', 'unbind', 'unbindall', 'echo', 'alias'].includes(name)) continue;
      else if (name === 'exec' || name === 'execifexists') limit('exec', statement);
      else if (registry?.get(name)?.kind === 'convar') {
        if (arg && (statement.tokens.length !== 2 || parameterFinding(statement, registry)))
          limit('dynamic', statement);
      } else if (registry || !knownNames?.has(name)) limit('dynamic', statement);
    }
  };
  if (parsed.issues.length) {
    limit('syntax');
    // Preserve lexical diagnostics without executing a malformed source.
    const declared = new Set<string>();
    for (const statement of parsed.statements.filter((s) => s.context === 'top')) {
      use(statement, declared.has(statement.tokens[0].value) ? 'uncertain' : 'native');
      if (statement.tokens[0].value === 'alias' && statement.tokens[1] && statement.tokens[2])
        declared.add(statement.tokens[1].value);
    }
  } else execute(parsed.statements.filter((s) => s.context === 'top'));
  const documentAliases = new Set([...aliases(parsed).keys(), ...result.aliases.keys()]);
  const scopes = new Map<number, Set<string>>();
  for (const statement of parsed.statements.filter((s) => s.context !== 'top')) {
    const name = statement.tokens[0].value;
    const scope = scopes.get(statement.parentStart!) ?? new Set<string>();
    scopes.set(statement.parentStart!, scope);
    result.deferred.set(
      statement.start,
      documentAliases.has(name) || scope.has(name) ? 'uncertain' : 'native',
    );
    if (name === 'alias' && statement.tokens[1] && statement.tokens[2])
      scope.add(statement.tokens[1].value);
  }
  return result;
}

/** A source body can run repeatedly under different definitions; disagreement stays uncertain. */
export function aliasInterpretation(
  resolution: AliasResolution,
  statement: Statement,
): AliasInterpretation {
  const uses = resolution.uses.get(statement.start);
  if (uses?.length) return uses.every((kind) => kind === uses[0]) ? uses[0] : 'uncertain';
  return statement.context === 'top'
    ? 'uncertain'
    : (resolution.deferred.get(statement.start) ?? 'uncertain');
}
