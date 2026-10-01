import * as vscode from 'vscode';
import { aliasAt, atOffset } from '../core/parser';
import { Services, selector, ui } from './services';
import { markdown } from './documentation';
import { execTarget } from './paths';
import { registerCompletion } from './completion';

export function registerProviders(services: Services, context: vscode.ExtensionContext): void {
  const { parsed, range, entries } = services;
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, {
      provideHover(doc, position) {
        const p = parsed(doc),
          hit = atOffset(p, doc.offsetAt(position));
        if (!hit) return;
        const symbolPosition =
          hit.index === 0 || (hit.statement.tokens[0].value === 'toggle' && hit.index === 1);
        const local = aliasAt(
          p,
          hit.token.value,
          hit.statement.start,
          hit.statement.context !== 'top',
        );
        if (
          local &&
          (symbolPosition || (hit.statement.tokens[0].value === 'alias' && hit.index === 1))
        ) {
          const md = new vscode.MarkdownString();
          md.appendText(ui('Local alias', 'Alias local'));
          md.appendCodeblock(local.body, 'cs2cfg');
          return new vscode.Hover(md, range(doc, hit.token.contentStart, hit.token.contentEnd));
        }
        const commandEntry = entries.get(hit.statement.tokens[0].value);
        const entry = symbolPosition
          ? entries.get(hit.token.value)
          : hit.index === 1 && (commandEntry?.parameter || commandEntry?.kind === 'convar')
            ? commandEntry
            : undefined;
        return entry
          ? new vscode.Hover(
              markdown(
                entry,
                doc,
                hit.statement.tokens[0].value === entry.name
                  ? hit.statement.tokens.slice(1).map((token) => token.value)
                  : undefined,
              ),
              range(doc, hit.token.contentStart, hit.token.contentEnd),
            )
          : undefined;
      },
    }),
    registerCompletion(services),
    vscode.languages.registerDefinitionProvider(selector, {
      async provideDefinition(doc, position, cancellation) {
        const p = parsed(doc),
          hit = atOffset(p, doc.offsetAt(position));
        if (!hit) return;
        if (hit.index === 0) {
          const local = aliasAt(
            p,
            hit.token.value,
            hit.statement.start,
            hit.statement.context !== 'top',
          );
          if (local)
            return new vscode.Location(
              doc.uri,
              range(doc, local.token.contentStart, local.token.contentEnd),
            );
        }
        if (hit.statement.tokens[0].value === 'exec' && hit.index === 1) {
          const target = await execTarget(doc, hit.token);
          if (target && !cancellation.isCancellationRequested)
            return new vscode.Location(target, new vscode.Position(0, 0));
        }
        return undefined;
      },
    }),
    vscode.languages.registerDocumentLinkProvider(selector, {
      async provideDocumentLinks(doc, cancellation) {
        const links = await Promise.all(
          parsed(doc)
            .statements.filter((s) => s.tokens[0].value === 'exec' && s.tokens[1])
            .map(async (s) => {
              const target = await execTarget(doc, s.tokens[1]);
              return target
                ? new vscode.DocumentLink(
                    range(doc, s.tokens[1].contentStart, s.tokens[1].contentEnd),
                    target,
                  )
                : undefined;
            }),
        );
        return cancellation.isCancellationRequested
          ? []
          : links.filter((link): link is vscode.DocumentLink => !!link);
      },
    }),
    vscode.commands.registerCommand('cs2Config.selectLanguage', async () => {
      const selected = await vscode.window.showQuickPick(['en', 'pt-BR', 'auto'], {
        title: ui('Catalog description language', 'Idioma das descrições do catálogo'),
      });
      if (selected)
        await vscode.workspace
          .getConfiguration('cs2Config')
          .update('descriptionLanguage', selected, vscode.ConfigurationTarget.Global);
    }),
  );
}
