import * as vscode from 'vscode';
import * as path from 'node:path';
import * as os from 'node:os';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ConfigSummary,
  configSummary,
  steamLibraryPaths,
  validCfgName,
} from '../core/config-workspace';
import { parse } from '../core/parser';
import { Services, MAX_DOCUMENT_LENGTH } from './services';

const STATE_KEY = 'cs2Config.authorizedFolder';
const FILE_LIMIT = 100;
export interface ConfigFile {
  name: string;
  summary?: ConfigSummary;
  unavailable?: boolean;
}
export interface FolderSnapshot {
  revision: number;
  folder?: string;
  typical: boolean;
  connected: boolean;
  limited: boolean;
  files: ConfigFile[];
}

/** Local file access is confined to an explicitly selected, canonical directory. */
export class ConfigFolder implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changed.event;
  private watcher?: vscode.FileSystemWatcher;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private disposed = false;
  snapshot: FolderSnapshot = {
    revision: 1,
    typical: false,
    connected: false,
    limited: false,
    files: [],
  };

  constructor(
    private readonly state: vscode.Memento,
    private readonly services: Services,
  ) {}

  async restore(): Promise<void> {
    const saved = this.state.get<unknown>(STATE_KEY);
    if (typeof saved !== 'string' || !path.isAbsolute(saved)) return;
    // Keep a missing folder visible so reconnecting never silently chooses another one.
    this.snapshot.folder = saved;
    this.watch();
    await this.refresh();
  }

  async connect(folder: string): Promise<void> {
    const canonical = await fs.realpath(folder);
    if (!(await fs.stat(canonical)).isDirectory()) throw new Error('Not a directory');
    await fs.readdir(canonical);
    await this.state.update(STATE_KEY, canonical);
    ++this.generation;
    this.snapshot = {
      revision: this.snapshot.revision + 1,
      folder: canonical,
      typical: /[\\/]game[\\/]csgo[\\/]cfg$/i.test(canonical),
      connected: false,
      limited: false,
      files: [],
    };
    this.changed.fire();
    this.watch();
    await this.refresh();
  }

  async disconnect(): Promise<void> {
    ++this.generation;
    this.watcher?.dispose();
    this.watcher = undefined;
    await this.state.update(STATE_KEY, undefined);
    this.snapshot = {
      revision: this.snapshot.revision + 1,
      typical: false,
      connected: false,
      limited: false,
      files: [],
    };
    this.changed.fire();
  }

  private watch(): void {
    this.watcher?.dispose();
    if (!this.snapshot.folder) return;
    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.snapshot.folder, '*'),
    );
    this.watcher.onDidCreate(() => this.schedule());
    this.watcher.onDidChange(() => this.schedule());
    this.watcher.onDidDelete(() => this.schedule());
  }

  schedule(): void {
    if (this.disposed) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.refresh(), 250);
  }

  async refresh(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    const folder = this.snapshot.folder;
    const result: FolderSnapshot = {
      revision: this.snapshot.revision + 1,
      folder,
      typical: !!folder && /[\\/]game[\\/]csgo[\\/]cfg$/i.test(folder),
      connected: false,
      limited: false,
      files: [],
    };
    if (folder) {
      try {
        if ((await fs.realpath(folder)) !== folder) throw new Error('Directory identity changed');
        const candidates = (await fs.readdir(folder, { withFileTypes: true }))
          .filter((item) => item.isFile() && /\.cfg$/i.test(item.name))
          .sort((a, b) => a.name.localeCompare(b.name));
        result.connected = true;
        result.limited = candidates.length > FILE_LIMIT;
        for (const item of candidates.slice(0, FILE_LIMIT)) {
          if (generation !== this.generation || this.disposed) return;
          const file: ConfigFile = { name: item.name };
          try {
            const uri = await this.fileUri(item.name, folder);
            if (!uri) throw new Error('Unsupported file');
            const open = vscode.workspace.textDocuments.find(
              (doc) => doc.uri.toString() === uri.toString(),
            );
            const text = open?.getText() ?? (await fs.readFile(uri.fsPath, 'utf8'));
            if (text.length > MAX_DOCUMENT_LENGTH) throw new Error('Analysis limit');
            const settings = vscode.workspace.getConfiguration('cs2Config', uri);
            file.summary = configSummary(
              open ? this.services.parsed(open) : parse(text),
              this.services.registry,
              open ? this.services.effective(open) : undefined,
              this.services.registry.reportedRejections(settings.get('consoleEvidence', 'none')),
            );
          } catch {
            file.unavailable = true;
          }
          result.files.push(file);
        }
      } catch {
        result.connected = false;
      }
    }
    if (generation !== this.generation || this.disposed) return;
    this.snapshot = result;
    this.changed.fire();
  }

  async fileUri(name: string, folder = this.snapshot.folder): Promise<vscode.Uri | undefined> {
    if (!folder || !validCfgName(name) || (await fs.realpath(folder)) !== folder) return;
    const target = path.join(folder, name);
    const info = await fs.lstat(target);
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_DOCUMENT_LENGTH * 4) return;
    if (path.dirname(await fs.realpath(target)) !== folder) return;
    return vscode.Uri.file(target);
  }

  async createEmpty(name: string, expectedFolder: string): Promise<vscode.Uri> {
    if (!validCfgName(name) || this.snapshot.folder !== expectedFolder)
      throw new Error('Invalid file');
    if ((await fs.realpath(expectedFolder)) !== expectedFolder)
      throw new Error('Directory identity changed');
    const uri = vscode.Uri.file(path.join(expectedFolder, name));
    // Exclusive creation: a racing creator or an existing CFG cannot be overwritten.
    const handle = await fs.open(uri.fsPath, 'wx');
    await handle.close();
    await this.refresh();
    return uri;
  }

  dispose(): void {
    this.disposed = true;
    ++this.generation;
    if (this.timer) clearTimeout(this.timer);
    this.watcher?.dispose();
    this.changed.dispose();
  }
}

export async function detectConfigFolders(): Promise<string[]> {
  const roots = new Set<string>();
  const home = os.homedir();
  if (process.platform === 'win32') {
    for (const programFiles of [process.env['ProgramFiles(x86)'], process.env.ProgramFiles])
      if (programFiles) roots.add(path.join(programFiles, 'Steam'));
    try {
      const { stdout } = await promisify(execFile)(
        'reg.exe',
        ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'],
        { timeout: 3000, windowsHide: true },
      );
      const steam = stdout.match(/SteamPath\s+REG_SZ\s+(.+)/i)?.[1].trim();
      if (steam) roots.add(steam);
    } catch {
      /* Manual selection remains available. */
    }
  } else if (process.platform === 'darwin') {
    roots.add(path.join(home, 'Library', 'Application Support', 'Steam'));
  } else {
    roots.add(path.join(home, '.local', 'share', 'Steam'));
    roots.add(path.join(home, '.steam', 'steam'));
  }
  for (const root of [...roots]) {
    try {
      const libraryFile = path.join(root, 'steamapps', 'libraryfolders.vdf');
      if ((await fs.stat(libraryFile)).size > 1_000_000) continue;
      for (const library of steamLibraryPaths(await fs.readFile(libraryFile, 'utf8')))
        roots.add(library);
    } catch {
      /* Missing libraries are not errors in first-use detection. */
    }
  }
  const results = new Set<string>();
  for (const library of roots) {
    const candidate = path.join(
      library,
      'steamapps',
      'common',
      'Counter-Strike Global Offensive',
      'game',
      'csgo',
      'cfg',
    );
    try {
      if ((await fs.stat(candidate)).isDirectory()) results.add(await fs.realpath(candidate));
    } catch {
      /* Detection checks existence, never executes Steam or CS2. */
    }
  }
  return [...results];
}
