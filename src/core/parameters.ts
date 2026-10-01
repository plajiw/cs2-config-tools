import { CommandRegistry } from '../catalog/registry';
import { Parsed, aliases } from './parser';
import { Finding } from './diagnostics';

/** Validate only evidenced constraints; queries and unknown signatures are left alone. */
export function parameterFindings(parsed: Parsed, registry: CommandRegistry): Finding[] {
  const findings: Finding[] = [];
  const localAliases = aliases(parsed);
  for (const statement of parsed.statements) {
    const [command, argument] = statement.tokens;
    const entry = registry.get(command.value);
    if (
      !entry ||
      !argument ||
      localAliases.has(command.value) ||
      entry.kind !== 'convar' ||
      statement.tokens.length !== 2
    )
      continue;
    const parameter = entry.parameter;
    const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(argument.value);
    const value = numeric
      ? Number(argument.value)
      : parameter?.type === 'boolean' && ['true', 'false'].includes(argument.value)
        ? Number(argument.value === 'true')
        : NaN;
    let code: string | undefined;
    if (
      parameter &&
      (parameter.type === 'boolean'
        ? !['0', '1', 'true', 'false'].includes(argument.value)
        : !Number.isFinite(value) || (parameter.type === 'integer' && !Number.isInteger(value)))
    )
      code = 'parameter-type';
    else if (
      parameter?.values &&
      parameter.type !== 'boolean' &&
      !parameter.values.some((option) => option.value === argument.value)
    )
      code = 'parameter-value';
    else {
      const min = entry.technical?.min ?? parameter?.min;
      const max = entry.technical?.max ?? parameter?.max;
      if (
        Number.isFinite(value) &&
        ((min !== undefined && value < min) || (max !== undefined && value > max))
      )
        code = 'parameter-range';
    }
    if (code)
      findings.push({
        start: argument.contentStart,
        end: argument.contentEnd,
        code,
        name: entry.name,
        severity: 'warning',
      });
  }
  return findings;
}
