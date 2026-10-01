import * as vscode from 'vscode';
import { descriptionLanguage } from '../core/locale';
import { aliases } from '../core/parser';
import { Services, selector } from './services';

export function registerInlays(services: Services, context: vscode.ExtensionContext): void {
  const changed = new vscode.EventEmitter<void>();
  context.subscriptions.push(
    changed,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('cs2Config')) changed.fire();
    }),
    vscode.languages.registerInlayHintsProvider(selector, {
      onDidChangeInlayHints: changed.event,
      provideInlayHints(doc, range) {
        const config = services.config(doc);
        if (!config.get('inlayHints', false)) return [];
        const language = descriptionLanguage(
          config.get('descriptionLanguage', 'en'),
          vscode.env.language,
        );
        const hints: vscode.InlayHint[] = [];
        const parsed = services.parsed(doc);
        const locals = aliases(parsed);
        for (const statement of parsed.statements) {
          const [command, argument] = statement.tokens;
          if (!argument || locals.has(command.value) || statement.tokens.length !== 2) continue;
          const label = services.registry.valueLabel(command.value, argument.value, language);
          const position = doc.positionAt(argument.end);
          if (!label || !range.contains(position)) continue;
          const hint = new vscode.InlayHint(position, label, vscode.InlayHintKind.Parameter);
          hint.paddingLeft = true;
          hints.push(hint);
        }
        return hints;
      },
    }),
  );
}
