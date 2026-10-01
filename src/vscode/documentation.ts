import * as vscode from 'vscode';
import { descriptionLanguage } from '../core/locale';
import { documentation } from '../core/documentation';
import { CatalogEntry } from '../catalog/types';

const cell = (text: string) => text.replace(/[\\|`]/g, '\\$&').replace(/[\r\n]/g, ' ');
export function markdown(
  entry: CatalogEntry,
  doc: vscode.TextDocument,
  currentArguments?: string[],
): vscode.MarkdownString {
  const settings = vscode.workspace.getConfiguration('cs2Config', doc.uri);
  const blocks = documentation(entry, {
    language: descriptionLanguage(settings.get('descriptionLanguage', 'en'), vscode.env.language),
    showOriginal: settings.get('showOriginalDescription', false),
    currentArguments,
    advanced: settings.get<string>('hoverDetails', 'standard') === 'advanced',
  });
  const md = new vscode.MarkdownString();
  for (const [index, block] of blocks.entries()) {
    if (index) md.appendMarkdown('\n\n');
    if (block.kind === 'text') md.appendText(block.text);
    else if (block.kind === 'code') md.appendCodeblock(block.text, 'cs2cfg');
    else if (block.kind === 'heading') {
      md.appendMarkdown('**');
      md.appendText(block.text);
      md.appendMarkdown('**');
    } else if (block.kind === 'field') {
      md.appendMarkdown('**');
      md.appendText(block.label);
      md.appendMarkdown('**\n\n');
      md.appendText(block.value);
    } else if (block.kind === 'link') {
      if (/^https:\/\//.test(block.url))
        md.appendMarkdown(
          '[' +
            cell(block.label) +
            '](' +
            encodeURI(block.url).replace(/[()]/g, encodeURIComponent) +
            ')',
        );
    } else {
      md.appendMarkdown('| ' + block.headings.map(cell).join(' | ') + ' |\n| --- | --- |\n');
      for (const row of block.rows)
        md.appendMarkdown('| ' + cell(row.value) + ' | ' + cell(row.meaning) + ' |\n');
    }
  }
  md.isTrusted = false;
  return md;
}
