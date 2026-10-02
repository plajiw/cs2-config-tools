import { Finding } from './diagnostics';
import { bindFindingMessage } from './binds';

/** Human explanations shared by editor diagnostics and reports. */
export function findingMessage(finding: Finding, language: 'en' | 'pt-BR'): string {
  const label = (en: string, br: string) => (language === 'pt-BR' ? br : en);
  if (finding.code.startsWith('bind-')) return bindFindingMessage(finding, language);
  if (finding.code === 'hidden-compatibility')
    return label(
      `Hidden in the referenced console snapshot. Prefer ${finding.replacement}; values require visual adjustment.`,
      `Oculto no snapshot de console de referência. Prefira ${finding.replacement}; os valores exigem ajuste visual.`,
    );
  const messages: Record<string, string> = {
    'unterminated-string': label(
      'Unterminated quoted string.',
      'Texto entre aspas sem fechamento.',
    ),
    unknown: label(
      'Not in this incomplete catalog; it may be an external alias or plugin command.',
      'Ausente deste catálogo incompleto; pode ser um alias externo ou comando de plugin.',
    ),
    'reported-rejection': label(
      'Rejected in the selected console report (2026-10-01, unidentified build). Verify your current build; no automatic replacement is available.',
      'Rejeitado no relato de console selecionado (01/10/2026, build não identificada). Confira sua build; não há substituição automática.',
    ),
    'missing-name': label('Provide a key or alias name.', 'Informe uma tecla ou nome de alias.'),
    'parameter-type': label(
      'Value does not match the reviewed parameter type.',
      'Valor incompatível com o tipo de parâmetro revisado.',
    ),
    'parameter-value': label(
      'Value is not among the reviewed choices.',
      'Valor ausente das opções revisadas.',
    ),
    'parameter-range': label(
      'Value is outside the documented range; the game may clamp it.',
      'Valor fora do intervalo documentado; o jogo pode limitar o valor.',
    ),
    'alias-cycle': label(
      'Alias expansion contains a cycle or exceeds the recursion limit.',
      'A expansão do alias contém um ciclo ou excede o limite de recursão.',
    ),
  };
  return messages[finding.code] ?? label('Finding requires review.', 'Achado requer revisão.');
}
