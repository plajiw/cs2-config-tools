import * as vscode from 'vscode';
import { analyze } from '../core/diagnostics';
import { parameterFindings } from '../core/parameters';
import { bindFindings } from '../core/binds';
import { findingMessage } from '../core/finding-message';
import { Services, ui } from './services';

export function registerDiagnostics(services: Services, context: vscode.ExtensionContext): void {
  const { config, parsed, range, names } = services;
  const compatibility = new Map(
    services.catalog.entries
      .filter((entry) => entry.compatibility)
      .map((entry) => [entry.name, entry.compatibility!.replacement]),
  );
  const diagnostics = vscode.languages.createDiagnosticCollection('cs2cfg');
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  function validate(doc: vscode.TextDocument): void {
    if (doc.languageId !== 'cs2cfg' || doc.isClosed) return;
    if (doc.getText().length > 1_000_000) {
      diagnostics.set(doc.uri, [
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          ui(
            'Analysis paused: file exceeds the one-million-character analysis limit.',
            'Análise pausada: arquivo excede o limite de um milhão de caracteres.',
          ),
          vscode.DiagnosticSeverity.Information,
        ),
      ]);
      return;
    }
    const settings = config(doc),
      unknown = settings.get<string>('unknownCommands', 'information'),
      bindSeverity = settings.get<string>('bindDiagnostics', 'information');

    diagnostics.set(
      doc.uri,
      [
        ...analyze(
          parsed(doc),
          names,
          services.registry.reportedRejections(settings.get('consoleEvidence', 'none')),
          compatibility,
          services.effective(doc).aliasResolution,
        ),
        ...(settings.get('parameterValidation', true)
          ? parameterFindings(
              parsed(doc),
              services.registry,
              services.effective(doc).aliasResolution,
            )
          : []),
        ...(bindSeverity === 'off' ? [] : bindFindings(services.effective(doc))),
      ]
        .filter((f) => f.code !== 'unknown' || unknown !== 'off')
        .map((f) => {
          const severity = f.code.startsWith('bind-')
            ? bindSeverity === 'warning'
              ? vscode.DiagnosticSeverity.Warning
              : vscode.DiagnosticSeverity.Information
            : f.code === 'unknown'
              ? unknown === 'warning'
                ? vscode.DiagnosticSeverity.Warning
                : vscode.DiagnosticSeverity.Information
              : f.severity === 'information'
                ? vscode.DiagnosticSeverity.Information
                : f.severity === 'error'
                  ? vscode.DiagnosticSeverity.Error
                  : vscode.DiagnosticSeverity.Warning;
          const diagnostic = new vscode.Diagnostic(
            range(doc, f.start, f.end),
            findingMessage(f, vscode.env.language.toLowerCase() === 'pt-br' ? 'pt-BR' : 'en'),
            severity,
          );
          diagnostic.code = f.code;
          diagnostic.source = 'CS2 Config';
          if (f.related)
            diagnostic.relatedInformation = f.related.map(
              (related) =>
                new vscode.DiagnosticRelatedInformation(
                  new vscode.Location(doc.uri, range(doc, related.start, related.end)),
                  related.role === 'previous-bind'
                    ? ui('Previous binding in this sequence.', 'Bind anterior nesta sequência.')
                    : ui(
                        'Binding defined in this alias body.',
                        'Bind definido no corpo deste alias.',
                      ),
                ),
            );
          return diagnostic;
        }),
    );
  }
  function schedule(doc: vscode.TextDocument): void {
    if (doc.languageId !== 'cs2cfg') return;
    const key = doc.uri.toString();
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        validate(doc);
      }, 180),
    );
  }
  context.subscriptions.push(
    diagnostics,
    vscode.workspace.onDidOpenTextDocument(schedule),
    vscode.workspace.onDidChangeTextDocument((event) => schedule(event.document)),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      const key = doc.uri.toString();
      clearTimeout(timers.get(key));
      timers.delete(key);
      services.evict(doc);
      diagnostics.delete(doc.uri);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('cs2Config')) vscode.workspace.textDocuments.forEach(schedule);
    }),
    {
      dispose() {
        for (const timer of timers.values()) clearTimeout(timer);
        timers.clear();
      },
    },
  );
  vscode.workspace.textDocuments.forEach(schedule);
}
