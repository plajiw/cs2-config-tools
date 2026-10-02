import { promises as fs } from 'node:fs';
import { TextDecoder } from 'node:util';

export type ReadFailure =
  | 'TOO_LARGE'
  | 'NOT_REGULAR_FILE'
  | 'NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'INVALID_ENCODING'
  | 'SOURCE_CHANGED'
  | 'UNAVAILABLE';
export class BoundedReadError extends Error {
  constructor(readonly code: ReadFailure) {
    super(code);
  }
}

/** A bounded, identity-checked UTF-8 read. Never follows a selected file symlink. */
export async function readUtf8FileBounded(file: string, maxBytes: number): Promise<string> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid read bound');
  try {
    const before = await fs.lstat(file);
    if (!before.isFile() || before.isSymbolicLink()) throw new BoundedReadError('NOT_REGULAR_FILE');
    if (before.size > maxBytes) throw new BoundedReadError('TOO_LARGE');
    const handle = await fs.open(file, 'r');
    try {
      const same = (stat: typeof before) =>
        stat.isFile() &&
        stat.dev === before.dev &&
        stat.ino === before.ino &&
        stat.size === before.size &&
        stat.mtimeMs === before.mtimeMs;
      if (!same(await handle.stat())) throw new BoundedReadError('SOURCE_CHANGED');
      const bytes = Buffer.alloc(Math.min(maxBytes + 1, before.size + 1));
      let length = 0;
      while (length < bytes.length) {
        const read = await handle.read(bytes, length, bytes.length - length, length);
        if (!read.bytesRead) break;
        length += read.bytesRead;
      }
      if (length > maxBytes) throw new BoundedReadError('TOO_LARGE');
      const after = await fs.lstat(file);
      if (
        length !== before.size ||
        after.isSymbolicLink() ||
        !same(after) ||
        !same(await handle.stat())
      )
        throw new BoundedReadError('SOURCE_CHANGED');
      try {
        // ignoreBOM preserves the BOM as source text for localized editing.
        return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
          bytes.subarray(0, length),
        );
      } catch {
        throw new BoundedReadError('INVALID_ENCODING');
      }
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error instanceof BoundedReadError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    throw new BoundedReadError(
      code === 'ENOENT'
        ? 'NOT_FOUND'
        : code === 'EACCES' || code === 'EPERM'
          ? 'ACCESS_DENIED'
          : 'UNAVAILABLE',
    );
  }
}
