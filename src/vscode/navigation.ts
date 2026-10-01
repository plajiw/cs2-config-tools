import * as vscode from 'vscode';
import { aliasAt, atOffset } from '../core/parser';
import { closestSymbols } from '../core/suggestions';
import { Services, selector, ui } from './services';

export function registerNavigation(services: Services, context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, {
      provideDocumentSymbols(doc) {
        return services
          .parsed(doc)
          .statements.filter((statement) => statement.context === 'top')
          .flatMap((statement) => {
            const [command, argument] = statement.tokens;
            const named =
              argument &&
              (command.value === 'exec' ||
                (['alias', 'bind'].includes(command.value) && statement.tokens[2]));
            if (!named && services.registry.get(command.value)?.kind !== 'convar') return [];
            const token = named ? argument : command;
            return [
              new vscode.DocumentSymbol(
                token.value,
                command.value,
                command.value === 'exec'
                  ? vscode.SymbolKind.File
                  : named
                    ? vscode.SymbolKind.Function
                    : vscode.SymbolKind.Variable,
                services.range(doc, statement.start, statement.end),
                services.range(doc, token.contentStart, token.contentEnd),
              ),
            ];
          });
      },
    }),
    vscode.languages.registerReferenceProvider(selector, {
      provideReferences(doc, position, options) {
        const parsed = services.parsed(doc);
        const hit = atOffset(parsed, doc.offsetAt(position));
        if (!hit) return [];
        const declaration = hit.statement.tokens[0].value === 'alias' && hit.index === 1;
        if (!declaration && hit.index !== 0) return [];
        const target = aliasAt(
          parsed,
          hit.token.value,
          hit.statement.start,
          hit.statement.context !== 'top',
        );
        if (!target) return [];
        const locations = options.includeDeclaration
          ? [
              new vscode.Location(
                doc.uri,
                services.range(doc, target.token.contentStart, target.token.contentEnd),
              ),
            ]
          : [];
        for (const statement of parsed.statements) {
          const token = statement.tokens[0];
          if (token.value !== hit.token.value) continue;
          const resolved = aliasAt(
            parsed,
            token.value,
            statement.start,
            statement.context !== 'top',
          );
          if (resolved?.token.start === target.token.start)
            locations.push(
              new vscode.Location(
                doc.uri,
                services.range(doc, token.contentStart, token.contentEnd),
              ),
            );
        }
        return locations;
      },
    }),
    vscode.languages.registerCodeActionsProvider(
      selector,
      {
        provideCodeActions(doc, _range, options) {
          return options.diagnostics
            .filter(
              (diagnostic) => diagnostic.code === 'unknown' && diagnostic.source === 'CS2 Config',
            )
            .flatMap((diagnostic) => {
              const name = doc.getText(diagnostic.range);
              return closestSymbols(name, services.registry).map((suggestion) => {
                const action = new vscode.CodeAction(
                  ui(`Change to ${suggestion}`, `Alterar para ${suggestion}`),
                  vscode.CodeActionKind.QuickFix,
                );
                action.diagnostics = [diagnostic];
                action.edit = new vscode.WorkspaceEdit();
                action.edit.replace(doc.uri, diagnostic.range, suggestion);
                return action;
              });
            });
        },
      },
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
  );
}
