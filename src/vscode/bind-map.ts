import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { bindMapModel, BindMapModel, isBindMapMessage } from '../core/bind-map';
import { descriptionLanguage } from '../core/locale';
import { MAX_DOCUMENT_LENGTH, Services, ui } from './services';

export function bindMapPage(webview: vscode.Webview, root: vscode.Uri): string {
  const nonce = randomBytes(24).toString('hex');
  const css = webview.asWebviewUri(vscode.Uri.joinPath(root, 'bind-map.css'));
  const script = webview.asWebviewUri(vscode.Uri.joinPath(root, 'bind-map.js'));
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${css}"><title>CS2 Config Tools</title></head>
<body><main><h1 id="title">Bind map</h1><p id="file"></p>
<p id="status" role="status" aria-live="polite"></p><p id="scope"></p>
<p id="legend"></p>
<div id="layout"></div><section aria-labelledby="detail-title"><h2 id="detail-title" tabindex="-1">Bind</h2>
<div id="details"></div></section><h2 id="list-title">All modeled binds</h2><div id="list"></div>
</main><script nonce="${nonce}" src="${script}"></script></body></html>`;
}

export function registerBindMap(services: Services, context: vscode.ExtensionContext): void {
  const resources = vscode.Uri.joinPath(context.extensionUri, 'resources', 'webview');
  let panel: vscode.WebviewPanel | undefined;
  let document: vscode.TextDocument | undefined;
  let model: BindMapModel | undefined;
  let version = -1;
  let snapshot = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  const update = () => {
    clearTimer();
    if (!panel) return;
    const doc = document;
    const pt = doc
      ? descriptionLanguage(
          services.config(doc).get('descriptionLanguage', 'en'),
          vscode.env.language,
        ) === 'pt-BR'
      : vscode.env.language.toLowerCase() === 'pt-br';
    const unavailable = !doc || doc.isClosed || doc.languageId !== 'cs2cfg';
    const oversized = !unavailable && doc.getText().length > MAX_DOCUMENT_LENGTH;
    model = unavailable || oversized ? undefined : bindMapModel(services.effective(doc));
    version = doc?.version ?? -1;
    snapshot++;
    void panel.webview.postMessage({
      type: 'state',
      snapshot,
      source: doc?.uri.toString() ?? '',
      version,
      pt,
      file: doc ? vscode.workspace.asRelativePath(doc.uri) : '',
      unavailable,
      oversized,
      model,
    });
    return model;
  };
  const schedule = () => {
    clearTimer();
    timer = setTimeout(update, 150);
  };
  context.subscriptions.push(
    {
      dispose: () => {
        clearTimer();
        panel?.dispose();
      },
    },
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === document) schedule();
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc === document) {
        document = undefined;
        update();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (document && event.affectsConfiguration('cs2Config.descriptionLanguage', document.uri))
        update();
    }),
    vscode.commands.registerCommand('cs2Config.bindMap', () => {
      const doc = vscode.window.activeTextEditor?.document;
      if (!doc || doc.languageId !== 'cs2cfg') return;
      document = doc;
      // No data from a previous document may remain navigable while the view reloads.
      model = undefined;
      version = -1;
      if (!panel) {
        panel = vscode.window.createWebviewPanel(
          'cs2Config.bindMap',
          ui('CS2 Bind Map', 'Mapa de binds CS2'),
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            localResourceRoots: [resources],
          },
        );
        const current = panel;
        const listeners = [
          current.webview.onDidReceiveMessage(async (message: unknown) => {
            if (!isBindMapMessage(message)) return;
            if (message.type === 'ready') {
              update();
              return;
            }
            const source = document;
            if (
              !source ||
              source.isClosed ||
              !model ||
              message.snapshot !== snapshot ||
              message.version !== version ||
              source.version !== version
            )
              return;
            const entry = model.entries[message.entry];
            if (!entry) return;
            const location =
              typeof message.target === 'number'
                ? entry.changes[message.target]?.origin
                : entry[message.target];
            if (!location) return;
            const editor = await vscode.window.showTextDocument(source, {
              viewColumn: vscode.ViewColumn.One,
            });
            if (source.version !== message.version || source !== document || panel !== current)
              return;
            const range = services.range(source, location.start, location.end);
            editor.selection = new vscode.Selection(range.start, range.end);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
          }),
          current.onDidChangeViewState((event) => {
            if (event.webviewPanel.visible) update();
          }),
        ];
        current.onDidDispose(() => {
          clearTimer();
          listeners.forEach((listener) => listener.dispose());
          panel = undefined;
          document = undefined;
          model = undefined;
        });
        current.webview.html = bindMapPage(current.webview, resources);
      } else panel.reveal(vscode.ViewColumn.Beside);
      const result = update();
      return { entries: result?.entries.length ?? 0, partial: result?.partial ?? true };
    }),
  );
}
