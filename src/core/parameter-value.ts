import { CommandRegistry, applicableParameter, parameterBounds } from '../catalog/registry';
import { Statement } from './parser';
import type { Finding } from './diagnostics';

/** Validate a native literal only; alias ownership is decided by ordered resolution. */
export function parameterFinding(
  statement: Statement,
  registry: CommandRegistry,
): Finding | undefined {
  const [command, argument] = statement.tokens;
  const entry = registry.get(command.value);
  if (!entry || !argument || entry.kind !== 'convar' || statement.tokens.length !== 2) return;
  const parameter = applicableParameter(entry);
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
    const { min, max } = parameterBounds(entry);
    if (
      Number.isFinite(value) &&
      ((min !== undefined && value < min) || (max !== undefined && value > max))
    )
      code = 'parameter-range';
  }
  return code
    ? {
        start: argument.contentStart,
        end: argument.contentEnd,
        code,
        name: entry.name,
        severity: 'warning',
      }
    : undefined;
}
