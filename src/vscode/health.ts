import * as vscode from 'vscode';
import { healthReport } from '../core/health';
import { bindFindingMessage } from '../core/binds';
import { descriptionLanguage } from '../core/locale';
import { Services, MAX_DOCUMENT_LENGTH } from './services';

export function registerHealth(services: Services, context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('CS2 Config Tools');
  context.subscriptions.push(
    output,
    vscode.commands.registerCommand('cs2Config.healthCheck', () => {
      const doc = vscode.window.activeTextEditor?.document;
      if (!doc || doc.languageId !== 'cs2cfg') return;
      const settings = services.config(doc);
      const pt =
        descriptionLanguage(settings.get('descriptionLanguage', 'en'), vscode.env.language) ===
        'pt-BR';
      const label = (en: string, br: string) => (pt ? br : en);
      output.clear();
      output.appendLine(label('CFG health check', 'Verificação da CFG'));
      output.appendLine(doc.uri.toString());
      output.appendLine(
        label(
          'Static single-file analysis. No commands executed; this is not the installed game state.',
          'Análise estática de arquivo único. Nenhum comando executado; este não é o estado do jogo instalado.',
        ),
      );
      if (doc.getText().length > MAX_DOCUMENT_LENGTH) {
        output.appendLine(
          label(
            'Analysis paused: document exceeds the analysis limit.',
            'Análise pausada: documento excede o limite de análise.',
          ),
        );
        output.show(true);
        return;
      }
      const report = healthReport(
        services.parsed(doc),
        services.registry,
        services.effective(doc),
        services.registry.reportedRejections(settings.get('consoleEvidence', 'none')),
      );
      output.appendLine('');
      output.appendLine(
        `${label('Top-level statements', 'Instruções principais')}: ${report.counts.statements}`,
      );
      output.appendLine(
        `${label('Commands / ConVars', 'Comandos / ConVars')}: ${report.counts.commands} / ${report.counts.convars}`,
      );
      output.appendLine(
        `${label('Modeled binds / aliases', 'Binds / aliases modelados')}: ${report.counts.binds} / ${report.counts.aliases}`,
      );
      output.appendLine(
        `${label('Certain literal assignments', 'Atribuições literais determinadas')}: ${report.counts.certainAssignments}`,
      );
      output.appendLine(`${label('Findings', 'Achados')}: ${report.findings.length}`);
      output.appendLine(
        `${label('Bind replacements / repetitions', 'Substituições / repetições de binds')}: ${report.counts.bindOverwrites} / ${report.counts.redundantBinds}`,
      );
      for (const finding of report.findings) {
        const message = finding.code.startsWith('bind-')
          ? bindFindingMessage(finding, pt ? 'pt-BR' : 'en')
          : finding.code + (finding.name ? ` · ${finding.name}` : '');
        const previous = finding.related?.find((related) => related.role === 'previous-bind');
        const origin = previous
          ? ` (${label('previous', 'anterior')}: ${doc.positionAt(previous.start).line + 1})`
          : '';
        output.appendLine(`  ${doc.positionAt(finding.start).line + 1}: ${message}${origin}`);
      }
      output.appendLine('');
      output.appendLine(
        report.state.complete
          ? label(
              'No unresolved effects in the modeled subset.',
              'Nenhum efeito não resolvido no subconjunto modelado.',
            )
          : label(
              'Partial result: unresolved effects may change state.',
              'Resultado parcial: efeitos não resolvidos podem alterar o estado.',
            ),
      );
      for (const limit of report.state.limits)
        output.appendLine(
          `  ${limit.statement ? doc.positionAt(limit.statement.start).line + 1 : '-'}: ${limit.code}${limit.name ? ` · ${limit.name}` : ''}`,
        );
      output.show(true);
      return {
        findings: report.findings.length,
        partial: !report.state.complete,
        counts: report.counts,
      };
    }),
  );
}
