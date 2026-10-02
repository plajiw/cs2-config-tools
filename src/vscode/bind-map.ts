import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { bindMapModel, BindMapModel, isBindMapMessage } from '../core/bind-map';
import { descriptionLanguage } from '../core/locale';
import { MAX_DOCUMENT_LENGTH, Services, ui } from './services';

export function bindMapPage(webview: vscode.Webview, root: vscode.Uri): string {
  const nonce = randomBytes(24).toString('hex');
  const css = webview.asWebviewUri(vscode.Uri.joinPath(root, 'bind-map.css'));
  const script = webview.asWebviewUri(vscode.Uri.joinPath(root, 'bind-map.js'));
  const layout = webview.asWebviewUri(vscode.Uri.joinPath(root, 'visual-input', 'layout.js'));
  const svg = webview.asWebviewUri(vscode.Uri.joinPath(root, 'visual-input', 'svg.js'));
  const visualState = webview.asWebviewUri(vscode.Uri.joinPath(root, 'visual-input', 'state.js'));
  const picker = webview.asWebviewUri(vscode.Uri.joinPath(root, 'visual-input', 'picker.js'));
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${css}"><title>CS2 Config Tools</title></head>
<body><main><header><div class="header-source"><h1 id="title">Bind map</h1><p id="intro"></p><div class="file-identity"><span class="file-icon" aria-hidden="true">CFG</span><code id="file"></code></div></div><span id="mode"></span></header>
<p id="summary" role="status" aria-live="polite"></p>
<button id="retry" type="button" hidden>Retry</button>
<div class="workspace"><aside aria-labelledby="filters-title"><details id="filter-panel" open><summary id="filters-title">Filters</summary><div class="filter-controls">
<div class="category-field"><label id="category-label" for="category">Category</label><div class="category-picker"><button id="category" type="button" value="all" aria-haspopup="listbox" aria-expanded="false" aria-controls="category-menu" aria-labelledby="category-label category-value"></button><div id="category-menu" role="listbox" aria-labelledby="category-label" hidden></div></div></div>
<div class="state-field"><label id="state-label" for="state-filter">State</label><select id="state-filter"></select></div>
<h2 id="legend-title">Status</h2><ul id="legend"></ul><details id="bind-list"><summary id="list-title">Literal binds</summary><div id="list"></div></details></div></details></aside>
<section class="canvas" id="layout" aria-label="Input devices"><div class="devices"><section class="keyboard-area" aria-labelledby="keyboard-title"><h2 id="keyboard-title">Keyboard</h2><div id="keyboard" tabindex="0" role="region" aria-labelledby="keyboard-title"></div><p id="selection-help"></p></section>
<section class="mouse-area" aria-labelledby="mouse-title"><h2 id="mouse-title">Mouse</h2><p id="mouse-note"></p><div class="mouse-content"><div id="mouse"></div><div id="mouse-actions" aria-labelledby="mouse-title"></div></div></section></div><div id="tooltip" role="tooltip" hidden></div></section>
<section class="inspector" aria-labelledby="detail-title"><h2 id="detail-title" tabindex="-1">Selected bind</h2><div id="details"></div></section></div>
<details class="analysis"><summary id="analysis-title">Analysis details</summary><p id="status"></p><p id="scope"></p><ul id="limits"></ul></details>
</main><script nonce="${nonce}" src="${layout}"></script><script nonce="${nonce}" src="${visualState}"></script><script nonce="${nonce}" src="${svg}"></script><script nonce="${nonce}" src="${picker}"></script><script nonce="${nonce}" src="${script}"></script></body></html>`;
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
    let failed = false;
    try {
      model =
        unavailable || oversized
          ? undefined
          : bindMapModel(services.effective(doc), {
              registry: services.registry,
              source: doc.getText(),
              language: pt ? 'pt-BR' : 'en',
            });
    } catch (error) {
      model = undefined;
      failed = true;
      console.error('CS2 Config Tools: unable to build bind map.', error);
    }
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
      failed,
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
                : message.target.startsWith('history:')
                  ? entry.history[Number(message.target.slice(8))]?.origin
                  : entry[message.target as 'origin' | 'definition'];
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
