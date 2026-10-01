import * as vscode from 'vscode';
import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import { parse, Parsed } from '../core/parser';
import { Catalog, CatalogEntry } from '../catalog/types';
import { CommandRegistry } from '../catalog/registry';
import { effectiveConfig, EffectiveConfig } from '../core/effective';

export const selector: vscode.DocumentSelector = { language: 'cs2cfg' };
export const MAX_DOCUMENT_LENGTH = 1_000_000;
export const ui = (english: string, portuguese: string): string =>
  vscode.env.language.toLowerCase() === 'pt-br' ? portuguese : english;

export interface Services {
  catalog: Catalog;
  registry: CommandRegistry;
  entries: ReadonlyMap<string, CatalogEntry>;
  names: Set<string>;
  config(document: vscode.TextDocument): vscode.WorkspaceConfiguration;
  parsed(document: vscode.TextDocument): Parsed;
  effective(document: vscode.TextDocument): EffectiveConfig;
  range(document: vscode.TextDocument, start: number, end: number): vscode.Range;
  evict(document: vscode.TextDocument): void;
}

/** Shared state is confined to one activation; the core knows nothing about VS Code. */
export function createServices(context: vscode.ExtensionContext): Services {
  const catalog: Catalog = JSON.parse(
    readFileSync(path.join(context.extensionPath, 'catalog/catalog.json'), 'utf8'),
  );
  const registry = new CommandRegistry(catalog);
  const entries = registry.entries;
  const cache = new Map<string, { version: number; parsed: Parsed; effective?: EffectiveConfig }>();
  context.subscriptions.push({ dispose: () => cache.clear() });
  const services: Services = {
    catalog,
    registry,
    entries,
    names: new Set(entries.keys()),
    config: (document) => vscode.workspace.getConfiguration('cs2Config', document.uri),
    parsed(document) {
      const key = document.uri.toString();
      const existing = cache.get(key);
      if (existing?.version === document.version) return existing.parsed;
      const text = document.getText();
      const parsed =
        text.length > MAX_DOCUMENT_LENGTH
          ? { statements: [], issues: [{ start: 0, end: 0, code: 'analysis-size-limit' }] }
          : parse(text);
      cache.set(key, { version: document.version, parsed });
      return parsed;
    },
    effective(document) {
      const parsed = services.parsed(document);
      const cached = cache.get(document.uri.toString())!;
      if (!cached.effective) cached.effective = effectiveConfig(parsed, registry);
      return cached.effective;
    },
    range: (document, start, end) =>
      new vscode.Range(document.positionAt(start), document.positionAt(end)),
    evict: (document) => cache.delete(document.uri.toString()),
  };
  return services;
}
