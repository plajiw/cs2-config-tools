import * as vscode from 'vscode';
import { healthReport } from '../core/health';
import { healthReportText } from '../core/health-presentation';
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
      const source = doc.getText();
      const file = doc.uri.scheme === 'file' ? doc.uri.fsPath : doc.uri.toString();
      if (source.length > MAX_DOCUMENT_LENGTH) {
        output.appendLine('CS2 Config Tools — CFG Health Check');
        output.appendLine(file);
        output.appendLine('');
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
      output.appendLine(healthReportText(report, source, file, pt ? 'pt-BR' : 'en'));
      output.show(true);
      return {
        findings: report.findings.length,
        partial: !report.state.complete,
        counts: report.counts,
      };
    }),
  );
}
