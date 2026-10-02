import { HealthReport } from './health';
import { findingMessage } from './finding-message';

/** Plain text presentation only: findings, severity and uncertainty come from the domain. */
export function healthReportText(
  report: HealthReport,
  source: string,
  file: string,
  language: 'en' | 'pt-BR',
): string {
  const label = (en: string, br: string) => (language === 'pt-BR' ? br : en);
  const plain = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, ' ');
  const starts = [0];
  for (const match of source.matchAll(/\r\n|\r|\n/g)) starts.push(match.index! + match[0].length);
  const line = (offset: number) => {
    let low = 0,
      high = starts.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (starts[middle] <= offset) low = middle + 1;
      else high = middle;
    }
    return `L${Math.max(1, low)}`;
  };
  const severity = {
    error: label('Error', 'Erro'),
    warning: label('Warning', 'Aviso'),
    information: label('Info', 'Informação'),
  };
  const total = (kind: keyof typeof severity) =>
    report.findings.filter((f) => f.severity === kind).length;
  const { counts } = report;
  const lines = [
    'CS2 Config Tools — CFG Health Check',
    plain(file),
    '',
    label('SUMMARY', 'RESUMO'),
    `  ${label('Findings', 'Achados')}: ${report.findings.length} · ${total('error')} ${label('errors', 'erros')} · ${total('warning')} ${label('warnings', 'avisos')} · ${total('information')} ${label('informational', 'informativos')}`,
    `  ${label('Analysis', 'Análise')}: ${report.state.complete ? label('No unresolved effects in the modeled subset', 'Sem efeitos não resolvidos no subconjunto modelado') : label('Partial analysis — unresolved effects may change the result', 'Análise parcial — efeitos não resolvidos podem alterar o resultado')}`,
    `  ${label('Top-level statements', 'Instruções principais')}: ${counts.statements}`,
    `  ${label('Recognized commands / ConVars', 'Comandos / ConVars reconhecidos')}: ${counts.commands} / ${counts.convars}`,
    `  ${label('Binds / aliases in the file model', 'Binds / aliases no modelo do arquivo')}: ${counts.binds} / ${counts.aliases}`,
    `  ${label('Certain literal assignments', 'Atribuições literais determinadas')}: ${counts.certainAssignments}`,
    `  ${label('Bind replacements / repetitions', 'Substituições / repetições de binds')}: ${counts.bindOverwrites} / ${counts.redundantBinds}`,
    '',
    label('FINDINGS', 'ACHADOS'),
  ];
  const groups: [string, string[]][] = [
    [label('Syntax', 'Sintaxe'), ['unterminated-string', 'missing-name']],
    [
      label('Values to review', 'Valores a revisar'),
      ['parameter-type', 'parameter-value', 'parameter-range'],
    ],
    [
      label(
        'Needs review — selected console report',
        'Requer revisão — relato de console selecionado',
      ),
      ['reported-rejection'],
    ],
    [label('Compatibility notes', 'Observações de compatibilidade'), ['hidden-compatibility']],
    [label('Names outside the catalog', 'Nomes fora do catálogo'), ['unknown']],
    [label('Repeated bindings', 'Binds repetidos'), ['bind-redundant']],
    [label('Replaced bindings', 'Binds substituídos'), ['bind-overwritten']],
    [label('Other findings', 'Outros achados'), []],
  ];
  const known = new Set(groups.flatMap(([, codes]) => codes));
  for (const [title, codes] of groups) {
    const findings = report.findings
      .filter((f) => (codes.length ? codes.includes(f.code) : !known.has(f.code)))
      .sort((a, b) => a.start - b.start);
    if (!findings.length) continue;
    lines.push('', `  ${title} (${findings.length})`);
    for (const finding of findings) {
      lines.push(
        `    ${line(finding.start)} [${severity[finding.severity]}]${finding.name ? ` ${plain(finding.name)}` : ''}`,
      );
      lines.push(`      ${plain(findingMessage(finding, language))}`);
      for (const related of finding.related ?? [])
        lines.push(
          `      ${label(related.role === 'previous-bind' ? 'Previous binding' : 'Binding defined in alias', related.role === 'previous-bind' ? 'Bind anterior' : 'Bind definido no alias')}: ${line(related.start)}`,
        );
    }
  }
  if (!report.findings.length)
    lines.push(
      `  ${label('No findings from these checks.', 'Nenhum achado nestas verificações.')}`,
    );
  lines.push('', label('UNRESOLVED EFFECTS', 'EFEITOS NÃO RESOLVIDOS'));
  const limits = {
    syntax: label(
      'Malformed text prevents state analysis; fix the syntax first.',
      'Texto malformado impede a análise de estado; corrija a sintaxe primeiro.',
    ),
    exec: label(
      'Referenced CFG is not analyzed here; inspect the exec target separately.',
      'A CFG referenciada não é analisada aqui; inspecione o destino do exec separadamente.',
    ),
    dynamic: label(
      'The analyzer cannot determine this effect; later state may be uncertain.',
      'O analisador não determina este efeito; o estado posterior pode ser incerto.',
    ),
    'alias-cycle': label(
      'Alias expansion cycles or exceeds the recursion limit; inspect the alias chain.',
      'A expansão de aliases tem ciclo ou excede o limite de recursão; inspecione a cadeia de aliases.',
    ),
    budget: label(
      'Analysis reached its operation limit; remaining effects are unresolved.',
      'A análise atingiu o limite de operações; os efeitos restantes não foram resolvidos.',
    ),
  };
  for (const limit of report.state.limits) {
    lines.push(
      `  ${limit.statement ? line(limit.statement.start) : label('File', 'Arquivo')}${limit.name ? ` ${plain(limit.name)}` : ''}`,
    );
    lines.push(`    ${limits[limit.code]}`);
  }
  if (!report.state.limits.length)
    lines.push(`  ${label('None in the modeled subset.', 'Nenhum no subconjunto modelado.')}`);
  lines.push(
    '',
    label('SCOPE AND NEXT STEPS', 'ESCOPO E PRÓXIMOS PASSOS'),
    `  ${label('Static single-file analysis, including unsaved text. No commands executed; this is not the running game state.', 'Análise estática de arquivo único, incluindo texto não salvo. Nenhum comando executado; este não é o estado do jogo em execução.')}`,
    `  ${label('Review errors and warnings first. Use the indicated lines and the Problems panel for editor diagnostics.', 'Revise erros e avisos primeiro. Use as linhas indicadas e o painel Problemas para os diagnósticos do editor.')}`,
    `  ${label('Health checks include findings hidden by editor settings. Informational findings and unresolved effects do not prove game errors.', 'O health check inclui achados ocultos pelas configurações do editor. Achados informativos e efeitos não resolvidos não comprovam erros no jogo.')}`,
  );
  return lines.join('\n');
}
