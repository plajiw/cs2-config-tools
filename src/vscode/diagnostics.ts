import * as vscode from 'vscode';
import { analyze, Finding } from '../core/diagnostics';
import { parameterFindings } from '../core/parameters';
import { bindFindings, bindFindingMessage } from '../core/binds';
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
    const messages: Record<string, string> = {
      'unterminated-string': ui('Unterminated quoted string.', 'Texto entre aspas sem fechamento.'),
      unknown: ui(
        'Not in this incomplete catalog; it may be an external alias or plugin command.',
        'Ausente deste catálogo incompleto; pode ser um alias externo ou comando de plugin.',
      ),
      'reported-rejection': ui(
        'Rejected in the selected console report (2026-10-01, unidentified build). Verify your current build; no automatic replacement is available.',
        'Rejeitado no relato de console selecionado (01/10/2026, build não identificada). Confira sua build; não há substituição automática.',
      ),
      'missing-name': ui('Provide a key or alias name.', 'Informe uma tecla ou nome de alias.'),
      'parameter-type': ui(
        'Value does not match the reviewed parameter type.',
        'Valor incompatível com o tipo de parâmetro revisado.',
      ),
      'parameter-value': ui(
        'Value is not among the reviewed choices.',
        'Valor ausente das opções revisadas.',
      ),
      'parameter-range': ui(
        'Value is outside the documented range; the game may clamp it.',
        'Valor fora do intervalo documentado; o jogo pode limitar o valor.',
      ),
      'alias-cycle': ui(
        'Alias expansion contains a cycle or exceeds the recursion limit.',
        'A expansão do alias contém um ciclo ou excede o limite de recursão.',
      ),
    };
    diagnostics.set(
      doc.uri,
      [
        ...analyze(
          parsed(doc),
          names,
          services.registry.reportedRejections(settings.get('consoleEvidence', 'none')),
          compatibility,
        ),
        ...(settings.get('parameterValidation', true)
          ? parameterFindings(parsed(doc), services.registry)
          : []),
        ...(bindSeverity === 'off' ? [] : bindFindings(services.effective(doc))),
        ...services
          .effective(doc)
          .limits.filter((limit) => limit.code === 'alias-cycle' && limit.statement)
          .map<Finding>((limit) => ({
            start: limit.statement!.tokens[0].contentStart,
            end: limit.statement!.tokens[0].contentEnd,
            code: 'alias-cycle',
            severity: 'warning' as const,
          })),
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
            f.code.startsWith('bind-')
              ? bindFindingMessage(
                  f,
                  vscode.env.language.toLowerCase() === 'pt-br' ? 'pt-BR' : 'en',
                )
              : f.code === 'hidden-compatibility'
                ? ui(
                    `Hidden in the referenced console snapshot. Prefer ${f.replacement}; values require visual adjustment.`,
                    `Oculto no snapshot de console de referência. Prefira ${f.replacement}; os valores exigem ajuste visual.`,
                  )
                : messages[f.code],
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
