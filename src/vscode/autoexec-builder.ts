import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import * as path from 'node:path';
import { Services, MAX_DOCUMENT_LENGTH } from './services';
import { BoundedReadError, readUtf8FileBounded } from './bounded-read';
import { descriptionLanguage } from '../core/locale';
import {
  BindPreview,
  previewBinds,
  searchBindActions,
  bindKeys,
  isBuilderMessage,
  assertFreshPreview,
} from '../core/bind-builder';

export function builderPage(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = randomBytes(24).toString('hex');
  const asset = (name: string) =>
    webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'webview', name));
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"><link rel="stylesheet" href="${asset('autoexec-builder.css')}"><title>Autoexec Builder</title></head><body><main id="builder">
  <header><p class="eyebrow">CS2 CONFIG TOOLS</p><h1>Autoexec Builder</h1><p id="intro"></p></header>
  <section aria-labelledby="destination-title"><h2 id="destination-title"></h2><div class="destination"><code id="destination-path"></code><button id="destination"></button></div></section>
  <section aria-labelledby="add-title"><h2 id="add-title"></h2><form id="add-form"><div class="fields"><label><span id="key-label"></span><select id="key"></select></label><label class="search-field"><span id="search-label"></span><input id="search" type="search" maxlength="200"></label></div><label><span id="action-label"></span><select id="action" size="6" required></select></label><p id="action-description"></p><label id="parameters-row"><span id="parameters-label"></span><input id="parameters" maxlength="400"></label><p id="parameter-help"></p><button id="add" type="submit"></button></form></section>
  <section aria-labelledby="bindings-title"><h2 id="bindings-title"></h2><p id="empty"></p><div id="bindings"></div><details><summary id="generated-title"></summary><pre id="generated"></pre></details><button id="review"></button></section>
  <section id="preview-section" hidden aria-labelledby="preview-title"><h2 id="preview-title"></h2><div id="human-diff"></div><div id="issues" role="status" aria-live="polite"></div><details><summary id="raw-title"></summary><pre id="raw-diff"></pre><button id="raw-editor"></button></details><label class="acknowledge"><input type="checkbox" id="acknowledge"><span id="acknowledge-label"></span></label><div class="buttons"><button id="apply"></button><button id="cancel"></button></div></section><p id="status" role="status" aria-live="polite"></p>
  </main><script nonce="${nonce}" src="${asset('autoexec-builder.js')}"></script></body></html>`;
}

async function diskText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    return await readUtf8FileBounded(uri.fsPath, MAX_DOCUMENT_LENGTH * 4);
  } catch (error) {
    if (error instanceof BoundedReadError && error.code === 'NOT_FOUND') return undefined;
    throw error;
  }
}

function boundedDocumentText(document: vscode.TextDocument): string {
  // offsetAt clamps a position beyond the final line to the document end.
  // Check the editor's UTF-16 length before allocating a copy of the buffer.
  if (document.offsetAt(new vscode.Position(document.lineCount, 0)) > MAX_DOCUMENT_LENGTH)
    throw new BoundedReadError('TOO_LARGE');
  const text = document.getText();
  if (text.length > MAX_DOCUMENT_LENGTH) throw new BoundedReadError('TOO_LARGE');
  return text;
}

export interface BuilderSnapshot {
  uri: vscode.Uri;
  destinationGeneration: number;
  previewGeneration: number;
  document?: vscode.TextDocument;
  version?: number;
  disk?: string;
  preview: BindPreview;
}

/** Editor edits retain undo. New files use exclusive WorkspaceEdit creation. */
export async function applyBuilderSnapshot(
  snapshot: BuilderSnapshot,
  assertAuthorized: () => void,
): Promise<void> {
  assertAuthorized();
  if (!vscode.workspace.isTrusted || snapshot.uri.scheme !== 'file')
    throw new Error('untrusted-destination');
  if ((await diskText(snapshot.uri)) !== snapshot.disk) throw new Error('stale-disk');
  assertAuthorized();
  if (snapshot.document) {
    const doc = snapshot.document;
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    assertAuthorized();
    if ((await diskText(snapshot.uri)) !== snapshot.disk) throw new Error('stale-disk');
    assertAuthorized();
    assertFreshPreview(snapshot.preview, boundedDocumentText(doc));
    if (doc.version !== snapshot.version || doc.isClosed) throw new Error('stale-document');
    const applied = await editor.edit(
      (builder) => {
        assertAuthorized();
        for (const edit of snapshot.preview.edits)
          builder.replace(
            new vscode.Range(doc.positionAt(edit.start), doc.positionAt(edit.end)),
            edit.text,
          );
      },
      { undoStopBefore: true, undoStopAfter: true },
    );
    if (!applied) throw new Error('edit-rejected');
  } else {
    assertFreshPreview(snapshot.preview, '');
    if (
      vscode.workspace.textDocuments.some((doc) => doc.uri.toString() === snapshot.uri.toString())
    )
      throw new Error('stale-open-document');
    const edit = new vscode.WorkspaceEdit();
    edit.createFile(snapshot.uri, { overwrite: false, ignoreIfExists: false });
    edit.insert(snapshot.uri, new vscode.Position(0, 0), snapshot.preview.result);
    assertAuthorized();
    if (!(await vscode.workspace.applyEdit(edit))) throw new Error('creation-rejected');
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(snapshot.uri), {
      preview: false,
    });
  }
}

export class AutoexecBuilder implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private destination?: vscode.Uri;
  private snapshot?: BuilderSnapshot;
  private sequence = 0;
  private destinationGeneration = 0;
  private busy?: object;
  private rawProvider: vscode.Disposable;
  private raw = new Map<string, string>();
  constructor(
    private services: Services,
    private context: vscode.ExtensionContext,
    private root: () => string | undefined,
  ) {
    this.rawProvider = vscode.workspace.registerTextDocumentContentProvider('cs2-builder-preview', {
      provideTextDocumentContent: (uri) => this.raw.get(uri.toString()) || '',
    });
  }
  private language() {
    return descriptionLanguage(
      vscode.workspace
        .getConfiguration('cs2Config', this.destination)
        .get('descriptionLanguage', 'en'),
      vscode.env.language,
    );
  }
  private t(en: string, pt: string) {
    return this.language() === 'pt-BR' ? pt : en;
  }
  private send() {
    void this.panel?.webview.postMessage({
      type: 'state',
      pt: this.language() === 'pt-BR',
      destination: this.destination?.fsPath,
      keys: bindKeys,
      actions: searchBindActions(this.services.registry, '', this.language()),
    });
  }
  private invalidate(): void {
    this.snapshot = undefined;
    this.sequence++;
  }
  private setDestination(uri?: vscode.Uri): void {
    if (uri?.toString() === this.destination?.toString()) return;
    this.destination = uri;
    this.destinationGeneration++;
    this.invalidate();
    this.busy = undefined;
  }
  async chooseDestination(): Promise<void> {
    const generation = this.destinationGeneration;
    const panel = this.panel;
    const current = () => generation === this.destinationGeneration && panel === this.panel;
    const root = this.root();
    const picked = await vscode.window.showQuickPick(
      [
        { label: this.t('Edit existing CFG', 'Editar CFG existente'), destinationKind: 'existing' },
        {
          label: this.t('Create new autoexec / CFG', 'Criar autoexec / CFG'),
          destinationKind: 'new',
        },
      ],
      { title: this.t('Choose destination', 'Escolher destino') },
    );
    if (!picked || !current()) return;
    const defaultUri = root ? vscode.Uri.file(path.join(root, 'autoexec.cfg')) : undefined;
    let uri =
      picked.destinationKind === 'existing'
        ? (
            await vscode.window.showOpenDialog({
              canSelectMany: false,
              filters: { CFG: ['cfg'] },
              defaultUri,
            })
          )?.[0]
        : await vscode.window.showSaveDialog({
            defaultUri,
            filters: { CFG: ['cfg'] },
            title: this.t(
              'New CFG — nothing is created until Apply',
              'Nova CFG — criada somente ao Aplicar',
            ),
          });
    if (!current() || !uri || uri.scheme !== 'file' || !/\.cfg$/i.test(uri.fsPath)) return;
    if (picked.destinationKind === 'new' && (await diskText(uri)) !== undefined) {
      const edit = this.t('Edit existing', 'Editar existente');
      if (
        (await vscode.window.showWarningMessage(
          this.t(
            'This CFG already exists. Edit it or choose another destination.',
            'Esta CFG já existe. Edite-a ou escolha outro destino.',
          ),
          { modal: true },
          edit,
        )) !== edit
      )
        return;
    }
    if (!current()) return;
    this.setDestination(uri);
    this.send();
  }
  async show(uri?: vscode.Uri): Promise<void> {
    if (
      uri?.scheme === 'file' &&
      /\.cfg$/i.test(uri.fsPath) &&
      uri.toString() !== this.destination?.toString()
    ) {
      this.setDestination(uri);
    }
    if (this.panel) {
      this.panel.reveal();
      this.send();
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      'cs2Config.autoexecBuilder',
      'Autoexec Builder',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'webview'),
        ],
      },
    );
    const panel = this.panel;
    const receiver = panel.webview.onDidReceiveMessage(async (message: unknown) => {
      if (this.panel !== panel || !isBuilderMessage(message)) return;
      if (message.type === 'cancel') {
        this.invalidate();
        this.busy = undefined;
        void panel.webview.postMessage({ type: 'cancelled' });
        return;
      }
      if (this.busy) return;
      if (message.type === 'ready') {
        this.send();
        return;
      }
      if (message.type === 'search') {
        void panel.webview.postMessage({
          type: 'actions',
          actions: searchBindActions(this.services.registry, message.query, this.language()),
        });
        return;
      }
      const operation = {};
      const generation = this.destinationGeneration;
      const current = () => this.panel === panel && this.destinationGeneration === generation;
      this.busy = operation;
      try {
        if (message.type === 'destination') await this.chooseDestination();
        if (message.type === 'preview') {
          this.invalidate();
          if (!this.destination) throw new Error('destination-required');
          const uri = this.destination;
          const previewGeneration = this.sequence;
          const disk = await diskText(uri);
          if (!current() || this.sequence !== previewGeneration) return;
          const document =
            disk !== undefined ? await vscode.workspace.openTextDocument(uri) : undefined;
          if (
            !current() ||
            this.sequence !== previewGeneration ||
            this.destination?.toString() !== uri.toString()
          )
            return;
          const source = document ? boundedDocumentText(document) : '';
          const preview = previewBinds(
            source,
            message.changes,
            this.services.registry,
            this.language(),
          );
          this.snapshot = {
            uri,
            document,
            version: document?.version,
            disk,
            preview,
            destinationGeneration: generation,
            previewGeneration,
          };
          void panel.webview.postMessage({ type: 'preview', snapshot: previewGeneration, preview });
        }
        if (message.type === 'rawDiff' && this.snapshot) {
          const id = randomBytes(12).toString('hex');
          const before = vscode.Uri.parse(`cs2-builder-preview:/${id}/before.cfg`),
            after = vscode.Uri.parse(`cs2-builder-preview:/${id}/after.cfg`);
          this.raw.set(before.toString(), this.snapshot.preview.source);
          this.raw.set(after.toString(), this.snapshot.preview.result);
          await vscode.commands.executeCommand(
            'vscode.diff',
            before,
            after,
            this.t('Autoexec Builder — review CFG', 'Autoexec Builder — revisar CFG'),
          );
        }
        if (message.type === 'apply') {
          const snapshot = this.snapshot;
          if (
            !snapshot ||
            message.snapshot !== this.sequence ||
            (snapshot.preview.warnings.length && !message.acknowledge)
          )
            throw new Error('review-required');
          const assertAuthorized = () => {
            if (
              !current() ||
              this.snapshot !== snapshot ||
              snapshot.uri.toString() !== this.destination?.toString() ||
              snapshot.destinationGeneration !== this.destinationGeneration ||
              snapshot.previewGeneration !== this.sequence
            )
              throw new Error('stale-authorization');
          };
          await applyBuilderSnapshot(snapshot, assertAuthorized);
          if (!current()) return;
          this.invalidate();
          void panel.webview.postMessage({ type: 'applied' });
        }
      } catch (error) {
        if (!current() || this.busy !== operation) return;
        this.invalidate();
        void panel.webview.postMessage({
          type: 'error',
          message:
            error instanceof BoundedReadError
              ? this.t(
                  `Unable to read the destination (${error.code}). Use a regular UTF-8 CFG within four million bytes and one million characters; review again if it changed.`,
                  `Não foi possível ler o destino (${error.code}). Use uma CFG UTF-8 regular de até quatro milhões de bytes e um milhão de caracteres; revise novamente se ela mudou.`,
                )
              : this.t(
                  'Nothing further was applied. Choose a destination or review again; the file may have changed.',
                  'Nenhuma alteração adicional foi aplicada. Escolha um destino ou revise novamente; o arquivo pode ter mudado.',
                ),
        });
      } finally {
        if (this.busy === operation) this.busy = undefined;
      }
    });
    panel.onDidDispose(() => {
      receiver.dispose();
      if (this.panel !== panel) return;
      this.panel = undefined;
      this.destinationGeneration++;
      this.invalidate();
      this.busy = undefined;
      this.raw.clear();
    });
    panel.webview.html = builderPage(panel.webview, this.context.extensionUri);
  }
  dispose(): void {
    this.panel?.dispose();
    this.rawProvider.dispose();
  }
}
