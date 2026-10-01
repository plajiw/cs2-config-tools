import * as vscode from 'vscode';
import * as path from 'node:path';
import { Token } from '../core/parser';

export async function execTarget(
  doc: vscode.TextDocument,
  token: Token,
): Promise<vscode.Uri | undefined> {
  const value = token.value;
  // A filename is data; never pass it to a shell. Restrict resolution to the selected CFG root.
  if (
    !value ||
    /[\0\r\n]/.test(value) ||
    path.win32.isAbsolute(value) ||
    path.posix.isAbsolute(value)
  )
    return undefined;
  const root = vscode.workspace.getConfiguration('cs2Config', doc.uri).get<string>('cfgRoot', '');
  if (root && !path.isAbsolute(root)) return undefined;
  const normalized = value.replace(/\\/g, '/');
  if (normalized.split('/').some((part) => part === '..')) return undefined;
  const base = root ? vscode.Uri.file(root) : vscode.Uri.joinPath(doc.uri, '..');
  const target = vscode.Uri.joinPath(
    base,
    /\.cfg$/i.test(normalized) ? normalized : `${normalized}.cfg`,
  );
  try {
    if ((await vscode.workspace.fs.stat(target)).type & vscode.FileType.File) return target;
  } catch {
    /* Missing or inaccessible is not proof of a game error. */
  }
  return undefined;
}
