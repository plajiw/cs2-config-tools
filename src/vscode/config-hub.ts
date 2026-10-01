import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { ConfigFolder, detectConfigFolders } from './config-folder';
import { isHubMessage, validCfgName, HubAction } from '../core/config-workspace';
import { descriptionLanguage } from '../core/locale';
import { Services } from './services';

export function hubPage(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = randomBytes(24).toString('hex');
  const root = vscode.Uri.joinPath(extensionUri, 'resources');
  const css = webview.asWebviewUri(vscode.Uri.joinPath(root, 'webview', 'config-hub.css'));
  const script = webview.asWebviewUri(vscode.Uri.joinPath(root, 'webview', 'config-hub.js'));
  const icon = webview.asWebviewUri(vscode.Uri.joinPath(root, 'icons', 'cs2-config-tools.png'));
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${css}"><title>CS2 Config Tools</title></head><body><main>
<header><img src="${icon}" alt="" width="64" height="64"><div><h1>CS2 Config Tools</h1><p id="tagline"></p></div><span id="connection" class="badge" role="status"></span></header>
<section id="welcome" aria-labelledby="welcome-title"><h2 id="welcome-title"></h2><p id="welcome-copy"></p><code>…/Counter-Strike Global Offensive/game/csgo/cfg</code><div class="buttons"><button data-action="detect" id="detect"></button><button data-action="choose" id="choose"></button></div></section>
<section class="tools" id="tools" aria-label="Tools"></section>
<section class="folder-card" aria-labelledby="folder-title"><div class="folder-content"><h2 id="folder-title"></h2><code id="folder-path"></code><p id="folder-note"></p><div class="buttons"><button data-action="choose" id="change"></button><button data-action="revealFolder" id="reveal"></button><button data-action="refresh" id="refresh"></button><button data-action="disconnect" id="disconnect"></button></div></div><aside><h3 id="access-title"></h3><p id="access-copy"></p></aside></section>
<div class="dashboard"><section aria-labelledby="overview-title"><h2 id="overview-title"></h2><p id="overview-copy"></p><div id="stats" class="stats"></div></section><section aria-labelledby="quick-title"><h2 id="quick-title"></h2><p id="quick-copy"></p><div id="quick" class="quick"></div></section></div>
<section aria-labelledby="files-title"><div class="section-heading"><div><h2 id="files-title"></h2><p id="files-note"></p></div><button data-action="new" id="new"></button></div><div class="table-scroll"><table><thead id="table-head"></thead><tbody id="files"></tbody></table></div><p id="empty"></p></section>
<p id="scope" class="scope"></p>
</main><script nonce="${nonce}" src="${script}"></script></body></html>`;
}

interface HubItem {
  label: string;
  command?: string;
  name?: string;
  description?: string;
  icon?: string;
}

class HubTree implements vscode.TreeDataProvider<HubItem> {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changed.event;
  constructor(private readonly items: () => HubItem[]) {}
  refresh(): void {
    this.changed.fire();
  }
  getChildren(): HubItem[] {
    return this.items();
  }
  getTreeItem(item: HubItem): vscode.TreeItem {
    const tree = new vscode.TreeItem(item.label, vscode.TreeItemCollapsibleState.None);
    tree.description = item.description;
    tree.tooltip = item.description ? `${item.label}\n${item.description}` : item.label;
    tree.iconPath = new vscode.ThemeIcon(item.icon ?? 'file');
    if (item.command)
      tree.command = {
        command: item.command,
        title: item.label,
        arguments: item.name ? [item.name] : [],
      };
    return tree;
  }
  dispose(): void {
    this.changed.dispose();
  }
}

export function registerConfigHub(services: Services, context: vscode.ExtensionContext): void {
  const folder = new ConfigFolder(context.globalState, services);
  let panel: vscode.WebviewPanel | undefined;
  let busy = false;
  const pt = () =>
    descriptionLanguage(
      vscode.workspace.getConfiguration('cs2Config').get('descriptionLanguage', 'en'),
      vscode.env.language,
    ) === 'pt-BR';
  const label = (en: string, br: string) => (pt() ? br : en);
  const workspaceTree = new HubTree(() => [
    { label: label('Home', 'Início'), command: 'cs2Config.home', icon: 'home' },
    {
      label: folder.snapshot.connected
        ? label('Connected folder', 'Pasta conectada')
        : label('Connect CFG folder', 'Conectar pasta de CFGs'),
      description: folder.snapshot.folder,
      command: 'cs2Config.chooseFolder',
      icon: 'folder-opened',
    },
  ]);
  const configTree = new HubTree(() =>
    folder.snapshot.files.map((file) => ({
      label: file.name,
      name: file.name,
      command: 'cs2Config.openConfig',
      icon: 'file-code',
      description: file.summary
        ? `${file.summary.binds} binds · ${file.summary.findings} ${label('findings', 'achados')}${file.summary.partial ? ' · ' + label('partial', 'parcial') : ''}`
        : label('Not analyzed', 'Não analisado'),
    })),
  );
  const toolsTree = new HubTree(() => [
    {
      label: label('Visual Bind Map', 'Mapa visual de binds'),
      command: 'cs2Config.hubBindMap',
      icon: 'keyboard',
    },
    {
      label: label('CFG Health Check', 'Verificação da CFG'),
      command: 'cs2Config.hubHealth',
      icon: 'pulse',
    },
    {
      label: label('New empty CFG', 'Nova CFG vazia'),
      command: 'cs2Config.newConfig',
      icon: 'new-file',
    },
  ]);
  const send = () => {
    workspaceTree.refresh();
    configTree.refresh();
    toolsTree.refresh();
    void panel?.webview.postMessage({ type: 'state', pt: pt(), ...folder.snapshot });
  };
  const notifyError = () =>
    void vscode.window.showErrorMessage(
      label(
        'Unable to access this CFG folder. Check the path and permissions, then refresh.',
        'Não foi possível acessar essa pasta de CFGs. Confira o caminho e as permissões e atualize.',
      ),
    );

  async function choose(detect = false): Promise<void> {
    let selected: vscode.Uri | undefined;
    if (detect) {
      const candidates = await detectConfigFolders();
      if (!candidates.length) {
        void vscode.window.showInformationMessage(
          label(
            'No CS2 CFG folder detected. Choose your folder manually.',
            'Nenhuma pasta de CFGs do CS2 detectada. Selecione a pasta manualmente.',
          ),
        );
        return;
      }
      const picked = await vscode.window.showQuickPick(
        candidates.map((candidate) => ({ label: candidate })),
        { title: label('Choose a detected CS2 CFG folder', 'Escolha uma pasta de CFGs detectada') },
      );
      if (picked) selected = vscode.Uri.file(picked.label);
    } else {
      selected = (
        await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          title: label('Connect CFG folder', 'Conectar pasta de CFGs'),
          openLabel: label('Select folder', 'Selecionar pasta'),
        })
      )?.[0];
    }
    if (!selected || selected.scheme !== 'file') return;
    const canonical = await fs.realpath(selected.fsPath);
    const typical = /[\\/]game[\\/]csgo[\\/]cfg$/i.test(canonical);
    const allow = label('Allow this folder', 'Permitir esta pasta');
    const approved = await vscode.window.showInformationMessage(
      label('Connect this CFG folder?', 'Conectar esta pasta de CFGs?'),
      {
        modal: true,
        detail:
          canonical +
          '\n\n' +
          label(
            'Read CFG files and analyze binds/settings. Create an empty CFG only when you request it; edit existing files in the text editor. No files are modified automatically.',
            'Ler CFGs e analisar binds/configurações. Criar uma CFG vazia somente quando você solicitar; editar arquivos existentes no editor de texto. Nenhum arquivo é alterado automaticamente.',
          ) +
          (typical
            ? ''
            : '\n\n' +
              label(
                'This is a custom folder, outside the usual game/csgo/cfg layout.',
                'Esta é uma pasta personalizada, fora do caminho habitual game/csgo/cfg.',
              )),
      },
      allow,
    );
    if (approved === allow) await folder.connect(canonical);
  }

  async function fileAction(action: HubAction, name?: string, revision?: number): Promise<void> {
    const snapshot = folder.snapshot;
    if (!snapshot.connected || (revision !== undefined && revision !== snapshot.revision)) return;
    let selected = name;
    if (!selected) {
      const current = vscode.window.activeTextEditor?.document.uri;
      selected = snapshot.files.find(
        (file) =>
          current?.fsPath ===
          vscode.Uri.joinPath(vscode.Uri.file(snapshot.folder!), file.name).fsPath,
      )?.name;
      if (!selected)
        selected = await vscode.window.showQuickPick(
          snapshot.files.map((file) => file.name),
          { title: label('Select CFG', 'Selecionar CFG') },
        );
    }
    if (!selected || !snapshot.files.some((file) => file.name === selected)) return;
    const uri = await folder.fileUri(selected);
    if (!uri || snapshot !== folder.snapshot) return;
    let doc = await vscode.workspace.openTextDocument(uri);
    if (doc.languageId !== 'cs2cfg')
      doc = await vscode.languages.setTextDocumentLanguage(doc, 'cs2cfg');
    if (snapshot !== folder.snapshot) return;
    await vscode.window.showTextDocument(doc, { preview: false });
    if (vscode.window.activeTextEditor?.document !== doc || snapshot !== folder.snapshot) return;
    if (action !== 'open')
      await vscode.commands.executeCommand(
        action === 'bindMap' ? 'cs2Config.bindMap' : 'cs2Config.healthCheck',
      );
  }

  async function create(): Promise<void> {
    const root = folder.snapshot.folder;
    if (!root || !folder.snapshot.connected) return;
    if (!vscode.workspace.isTrusted) {
      void vscode.window.showWarningMessage(
        label(
          'Trust this workspace before creating files.',
          'Confie neste workspace antes de criar arquivos.',
        ),
      );
      return;
    }
    const name = await vscode.window.showInputBox({
      title: label('New empty CFG', 'Nova CFG vazia'),
      prompt: label(
        'File name; existing files are never replaced.',
        'Nome do arquivo; arquivos existentes nunca são substituídos.',
      ),
      value: 'myconfig.cfg',
      validateInput: (value) =>
        validCfgName(value)
          ? undefined
          : label(
              'Use a simple file name ending in .cfg, without paths or reserved names.',
              'Use um nome simples terminado em .cfg, sem caminhos ou nomes reservados.',
            ),
    });
    if (!name) return;
    const createLabel = label('Create file', 'Criar arquivo');
    if (
      (await vscode.window.showInformationMessage(
        label('Create an empty CFG?', 'Criar uma CFG vazia?'),
        { modal: true, detail: vscode.Uri.joinPath(vscode.Uri.file(root), name).fsPath },
        createLabel,
      )) !== createLabel
    )
      return;
    try {
      if (!vscode.workspace.isTrusted) return;
      const uri = await folder.createEmpty(name, root);
      let doc = await vscode.workspace.openTextDocument(uri);
      if (doc.languageId !== 'cs2cfg')
        doc = await vscode.languages.setTextDocumentLanguage(doc, 'cs2cfg');
      await vscode.window.showTextDocument(doc, {
        preview: false,
      });
    } catch {
      void vscode.window.showErrorMessage(
        label(
          'Could not create the file. It may already exist or the folder may be unavailable. Nothing was overwritten.',
          'Não foi possível criar o arquivo. Ele pode já existir ou a pasta estar indisponível. Nenhum arquivo foi substituído.',
        ),
      );
    }
  }

  const guarded = async (action: () => Promise<unknown>) => {
    if (busy) return;
    busy = true;
    try {
      await action();
    } catch {
      notifyError();
    } finally {
      busy = false;
    }
  };
  const show = () => {
    if (panel) {
      panel.reveal();
      send();
      return folder.snapshot;
    }
    panel = vscode.window.createWebviewPanel(
      'cs2Config.home',
      'CS2 Config Tools',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'resources', 'webview'),
          vscode.Uri.joinPath(context.extensionUri, 'resources', 'icons'),
        ],
      },
    );
    const current = panel;
    const receiver = current.webview.onDidReceiveMessage((message: unknown) => {
      if (!isHubMessage(message)) return;
      if (message.type === 'ready') {
        send();
        return;
      }
      void guarded(async () => {
        switch (message.type) {
          case 'choose':
            return choose();
          case 'detect':
            return choose(true);
          case 'refresh':
            return folder.refresh();
          case 'disconnect':
            return folder.disconnect();
          case 'new':
            return create();
          case 'revealFolder':
            if (folder.snapshot.connected && folder.snapshot.folder)
              return vscode.commands.executeCommand(
                'revealFileInOS',
                vscode.Uri.file(folder.snapshot.folder),
              );
            return;
          default:
            if ('file' in message) return fileAction(message.type, message.file, message.revision);
        }
      });
    });
    current.onDidDispose(() => {
      receiver.dispose();
      panel = undefined;
    });
    current.webview.html = hubPage(current.webview, context.extensionUri);
    send();
    return folder.snapshot;
  };

  context.subscriptions.push(
    folder,
    workspaceTree,
    configTree,
    toolsTree,
    { dispose: () => panel?.dispose() },
    vscode.window.registerTreeDataProvider('cs2Config.workspace', workspaceTree),
    vscode.window.registerTreeDataProvider('cs2Config.configs', configTree),
    vscode.window.registerTreeDataProvider('cs2Config.tools', toolsTree),
    folder.onDidChange(send),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (
        event.document.uri.scheme === 'file' &&
        event.document.uri.fsPath.startsWith((folder.snapshot.folder ?? '\0') + path.sep)
      )
        folder.schedule();
    }),
    vscode.workspace.onDidCloseTextDocument(() => folder.schedule()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('cs2Config')) {
        send();
        folder.schedule();
      }
    }),
    vscode.commands.registerCommand('cs2Config.home', show),
    vscode.commands.registerCommand('cs2Config.chooseFolder', () => guarded(() => choose())),
    vscode.commands.registerCommand('cs2Config.detectFolder', () => guarded(() => choose(true))),
    vscode.commands.registerCommand('cs2Config.refreshFolder', () =>
      guarded(() => folder.refresh()),
    ),
    vscode.commands.registerCommand('cs2Config.newConfig', () => guarded(create)),
    vscode.commands.registerCommand('cs2Config.openConfig', (name?: string) =>
      guarded(() => fileAction('open', name)),
    ),
    vscode.commands.registerCommand('cs2Config.hubBindMap', () =>
      guarded(() => fileAction('bindMap')),
    ),
    vscode.commands.registerCommand('cs2Config.hubHealth', () =>
      guarded(() => fileAction('health')),
    ),
  );
  void folder.restore().catch(notifyError);
}
