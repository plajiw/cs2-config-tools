import { Finding } from './diagnostics';
import { BindChange, EffectiveConfig, StateValue } from './effective';

function location(value: StateValue) {
  const token = value.invocation?.tokens[0] ?? value.statement.tokens[1];
  return { start: token.contentStart, end: token.contentEnd };
}
/** Only uninterrupted, certain writes conflict. Resets and uncertainty are handled by the model. */
export function bindFindings(state: EffectiveConfig): Finding[] {
  return state.bindChanges.map((change: BindChange) => {
    const related: NonNullable<Finding['related']> = [
      { ...location(change.previous), role: 'previous-bind' },
    ];
    if (change.current.invocation) {
      const key = change.current.statement.tokens[1];
      related.push({ start: key.contentStart, end: key.contentEnd, role: 'bind-definition' });
    }
    return {
      ...location(change.current),
      name: change.key,
      code: change.kind === 'redundant' ? 'bind-redundant' : 'bind-overwritten',
      severity: 'information',
      related,
    };
  });
}

export function bindFindingMessage(finding: Finding, language: 'en' | 'pt-BR'): string {
  const pt = language === 'pt-BR';
  return finding.code === 'bind-redundant'
    ? pt
      ? `O bind de ${finding.name} repete a mesma ação já definida nesta sequência.`
      : `Binding for ${finding.name} repeats the same action already defined in this sequence.`
    : pt
      ? `O bind de ${finding.name} substitui a ação anterior nesta sequência; confira se foi intencional.`
      : `Binding for ${finding.name} replaces the previous action in this sequence; check that this is intentional.`;
}
