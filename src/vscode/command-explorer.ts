import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { searchCommands } from '../core/command-explorer';
import { documentation } from '../core/documentation';
import { Services } from './services';

export function explorerPage(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = randomBytes(24).toString('hex');
  const css = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'config-hub.css'),
  );
  const script = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'command-explorer.js'),
  );
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"><link rel="stylesheet" href="${css}"><title>Command Explorer</title></head><body><main><h1 id="explorer-title"></h1><p id="explorer-note"></p><div class="buttons"><button id="search"></button><button id="copy"></button></div><h2 id="command-name"></h2><div id="command-doc"></div></main><script nonce="${nonce}" src="${script}"></script></body></html>`;
}

export class CommandExplorer implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private name?: string;
  private picker?: vscode.QuickPick<vscode.QuickPickItem>;
  constructor(
    private readonly services: Services,
    private readonly extensionUri: vscode.Uri,
    private readonly pt: () => boolean,
  ) {}

  private send(): void {
    const entry = this.name ? this.services.registry.get(this.name) : undefined;
    void this.panel?.webview.postMessage({
      type: 'command',
      pt: this.pt(),
      name: entry?.name,
      blocks: entry
        ? documentation(entry, {
            language: this.pt() ? 'pt-BR' : 'en',
            advanced: true,
            showOriginal: true,
          })
        : [],
    });
  }

  show(): void {
    if (!this.panel) {
      const panel = vscode.window.createWebviewPanel(
        'cs2Config.commandExplorer',
        this.pt() ? 'Explorador de comandos' : 'Command Explorer',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'resources', 'webview')],
        },
      );
      this.panel = panel;
      const receiver = panel.webview.onDidReceiveMessage((message: unknown) => {
        if (
          !message ||
          typeof message !== 'object' ||
          Array.isArray(message) ||
          Object.keys(message).length !== 1
        )
          return;
        const type = (message as { type?: unknown }).type;
        if (type === 'ready') this.send();
        if (type === 'search') this.search();
        if (type === 'copy' && this.name && this.services.registry.get(this.name))
          void vscode.env.clipboard.writeText(this.name);
      });
      panel.onDidDispose(() => {
        receiver.dispose();
        this.panel = undefined;
        this.picker?.hide();
      });
      panel.webview.html = explorerPage(panel.webview, this.extensionUri);
    } else this.panel.reveal();
    this.send();
    this.search();
  }

  private search(): void {
    if (this.picker) {
      this.picker.show();
      return;
    }
    const picker = vscode.window.createQuickPick();
    this.picker = picker;
    picker.title = this.pt() ? 'Explorar comandos' : 'Explore commands';
    picker.placeholder = this.pt()
      ? 'Busque pelo nome ou descrição; Enter abre a documentação'
      : 'Search name or description; Enter opens documentation';
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    let mode = vscode.workspace
      .getConfiguration('cs2Config')
      .get<'normal' | 'advanced'>('completionMode', 'normal');
    const update = () => {
      picker.title =
        (this.pt() ? 'Explorar comandos' : 'Explore commands') +
        (mode === 'advanced'
          ? this.pt()
            ? ' · inclui internos/ocultos'
            : ' · includes internal/hidden'
          : '');
      picker.buttons = [
        {
          iconPath: new vscode.ThemeIcon(mode === 'advanced' ? 'eye' : 'eye-closed'),
          tooltip: this.pt() ? 'Alternar catálogo normal/completo' : 'Toggle normal/full catalog',
        },
      ];
      picker.items = searchCommands(this.services.registry, picker.value, this.pt(), mode).map(
        (item) => ({ label: item.name, description: item.kind, detail: item.description }),
      );
    };
    const listeners = [
      picker.onDidTriggerButton(() => {
        mode = mode === 'normal' ? 'advanced' : 'normal';
        update();
      }),
      picker.onDidChangeValue(update),
      picker.onDidAccept(() => {
        const selected = picker.selectedItems[0];
        if (!selected || !this.services.registry.get(selected.label)) return;
        this.name = selected.label;
        this.send();
        picker.hide();
      }),
      picker.onDidHide(() => {
        listeners.forEach((listener) => listener.dispose());
        picker.dispose();
        if (this.picker === picker) this.picker = undefined;
      }),
    ];
    update();
    picker.show();
  }

  dispose(): void {
    this.picker?.hide();
    this.panel?.dispose();
  }

  refresh(): void {
    this.send();
  }
}
