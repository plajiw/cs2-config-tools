import * as vscode from 'vscode';
import * as path from 'node:path';
import { Token } from '../core/parser';

export function execFilename(value: string): string | undefined {
  if (
    !value ||
    /[\0\r\n]/.test(value) ||
    path.win32.isAbsolute(value) ||
    path.posix.isAbsolute(value)
  )
    return undefined;
  const normalized = value.replace(/\\/g, '/');
  if (normalized.split('/').some((part) => part === '..')) return undefined;
  return /\.cfg$/i.test(normalized) ? normalized : `${normalized}.cfg`;
}

export async function execTarget(
  doc: vscode.TextDocument,
  token: Token,
): Promise<vscode.Uri | undefined> {
  // Lexical navigation only: reject absolute/traversal syntax; filesystem links may be followed by the editor.
  const normalized = execFilename(token.value);
  if (!normalized) return undefined;
  const root = vscode.workspace.getConfiguration('cs2Config', doc.uri).get<string>('cfgRoot', '');
  if (root && !path.isAbsolute(root)) return undefined;
  const base = root ? vscode.Uri.file(root) : vscode.Uri.joinPath(doc.uri, '..');
  const target = vscode.Uri.joinPath(base, normalized);
  try {
    if ((await vscode.workspace.fs.stat(target)).type & vscode.FileType.File) return target;
  } catch {
    /* Missing or inaccessible is not proof of a game error. */
  }
  return undefined;
}
