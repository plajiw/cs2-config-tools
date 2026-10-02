import * as vscode from 'vscode';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { detectSteamRoots } from './config-folder';
import { parseVideoSettings, VideoSettings } from '../core/video-settings';

const STATE_KEY = 'cs2Config.authorizedUserdata';
const VIDEO_FILE = 'cs2_video.txt';
export interface UserdataSnapshot {
  folder?: string;
  connected: boolean;
  status: 'disconnected' | 'loading' | 'missing' | 'available' | 'invalid' | 'unavailable';
  video?: VideoSettings;
  profileId?: string;
  controlsFile?: string;
}

/** Reads only the known video file inside an independently authorized directory. */
export class SteamUserdata implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changed.event;
  private watcher?: vscode.FileSystemWatcher;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private disposed = false;
  snapshot: UserdataSnapshot = { connected: false, status: 'disconnected' };
  constructor(private readonly state: vscode.Memento) {}

  async restore(): Promise<void> {
    const saved = this.state.get<unknown>(STATE_KEY);
    if (typeof saved !== 'string' || !path.isAbsolute(saved)) return;
    this.snapshot = { folder: saved, connected: false, status: 'loading' };
    this.watch();
    await this.refresh();
  }

  async connect(folder: string): Promise<void> {
    const canonical = await fs.realpath(folder);
    if (!(await fs.stat(canonical)).isDirectory()) throw new Error('Not a directory');
    await fs.readdir(canonical);
    await this.state.update(STATE_KEY, canonical);
    ++this.generation;
    this.snapshot = { folder: canonical, connected: false, status: 'loading' };
    this.changed.fire();
    this.watch();
    await this.refresh();
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

  async readVideo(expectedFolder = this.snapshot.folder): Promise<string> {
    if (
      !expectedFolder ||
      this.snapshot.folder !== expectedFolder ||
      (await fs.realpath(expectedFolder)) !== expectedFolder
    )
      throw new Error('Directory identity changed');
    const target = path.join(expectedFolder, VIDEO_FILE);
    const stat = await fs.lstat(target);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size > 256_000 ||
      path.dirname(await fs.realpath(target)) !== expectedFolder
    )
      throw new Error('Unsupported video file');
    const uri = vscode.Uri.file(target);
    const open = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString(),
    );
    let text = open?.getText();
    if (text === undefined) {
      const handle = await fs.open(target, 'r');
      try {
        const opened = await handle.stat();
        if (
          !opened.isFile() ||
          opened.size > 256_000 ||
          opened.ino !== stat.ino ||
          opened.dev !== stat.dev
        )
          throw new Error('Video file identity changed');
        const bytes = Buffer.alloc(256_001);
        let length = 0;
        while (length < bytes.length) {
          const read = await handle.read(bytes, length, bytes.length - length, length);
          if (!read.bytesRead) break;
          length += read.bytesRead;
        }
        if (
          length > 256_000 ||
          (await fs.realpath(expectedFolder)) !== expectedFolder ||
          path.dirname(await fs.realpath(target)) !== expectedFolder
        )
          throw new Error('Unsupported video file');
        text = bytes.subarray(0, length).toString('utf8');
      } finally {
        await handle.close();
      }
    }
    if (text.length > 256_000) throw new Error('Size limit');
    return text;
  }

  async fileUri(kind: 'video' | 'controls'): Promise<vscode.Uri> {
    const folder = this.snapshot.folder;
    const name = kind === 'video' ? VIDEO_FILE : this.snapshot.controlsFile;
    if (
      !folder ||
      !this.snapshot.connected ||
      !name ||
      (kind === 'controls' && !/^cs2_user_keys_\d+_slot\d+\.vcfg$/i.test(name))
    )
      throw new Error('No connected saved file');
    if ((await fs.realpath(folder)) !== folder) throw new Error('Folder changed');
    const target = path.join(folder, name);
    const stat = await fs.lstat(target);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size > 256_000 ||
      path.dirname(await fs.realpath(target)) !== folder
    )
      throw new Error('Unsupported saved file');
    return vscode.Uri.file(target);
  }

  async refresh(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    const folder = this.snapshot.folder;
    const next: UserdataSnapshot = {
      folder,
      connected: false,
      status: folder ? 'unavailable' : 'disconnected',
    };
    if (folder) {
      try {
        if ((await fs.realpath(folder)) !== folder || !(await fs.stat(folder)).isDirectory())
          throw new Error('Directory changed');
        const files = await fs.readdir(folder, { withFileTypes: true });
        next.profileId = folder.match(/[\\/]userdata[\\/](\d+)[\\/]730[\\/]local[\\/]cfg$/i)?.[1];
        next.controlsFile = files
          .filter((file) => file.isFile() && /^cs2_user_keys_\d+_slot\d+\.vcfg$/i.test(file.name))
          .map((file) => file.name)
          .sort()[0];
        next.connected = true;
        try {
          next.video = parseVideoSettings(await this.readVideo(folder));
          next.status = next.video.issues.length ? 'invalid' : 'available';
        } catch (error) {
          next.status =
            (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unavailable';
        }
      } catch {
        /* Preserve the path for explicit recovery. */
      }
    }
    if (this.disposed || generation !== this.generation) return;
    const reconnect = next.connected && !this.snapshot.connected;
    this.snapshot = next;
    if (reconnect) this.watch();
    this.changed.fire();
  }

  async disconnect(): Promise<void> {
    ++this.generation;
    if (this.timer) clearTimeout(this.timer);
    this.watcher?.dispose();
    this.watcher = undefined;
    await this.state.update(STATE_KEY, undefined);
    this.snapshot = { connected: false, status: 'disconnected' };
    this.changed.fire();
  }

  dispose(): void {
    this.disposed = true;
    ++this.generation;
    if (this.timer) clearTimeout(this.timer);
    this.watcher?.dispose();
    this.changed.dispose();
  }
}

export async function detectUserdataFolders(roots?: readonly string[]): Promise<string[]> {
  const results = new Set<string>();
  for (const root of roots ?? (await detectSteamRoots())) {
    try {
      const userdata = path.join(root, 'userdata');
      const profiles = (await fs.readdir(userdata, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
        .slice(0, 100);
      for (const profile of profiles) {
        const folder = path.join(userdata, profile.name, '730', 'local', 'cfg');
        try {
          if ((await fs.lstat(folder)).isDirectory()) results.add(await fs.realpath(folder));
        } catch {
          /* Missing CS2 profile. */
        }
      }
    } catch {
      /* Manual selection remains available. */
    }
  }
  return [...results].sort();
}
