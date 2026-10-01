import * as vscode from 'vscode';
import { formatCfg, FormatterOptions } from '../core/formatter';
import { MAX_DOCUMENT_LENGTH, selector } from './services';

function options(document: vscode.TextDocument): FormatterOptions {
  const config = vscode.workspace.getConfiguration('cs2Config', document.uri);
  return {
    eol: document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n',
    maxBlankLines: config.get('formatting.maxBlankLines', 1),
    separateSections: config.get('formatting.separateSections', true),
    insertFinalNewline: config.get('formatting.insertFinalNewline', true),
  };
}

function edit(
  document: vscode.TextDocument,
  range: vscode.Range,
  settings: FormatterOptions,
): vscode.TextEdit[] {
  const original = document.getText(range);
  const formatted = formatCfg(original, settings);
  return original === formatted ? [] : [vscode.TextEdit.replace(range, formatted)];
}

export function registerFormatting(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selector, {
      provideDocumentFormattingEdits(document, _options, cancellation) {
        if (cancellation.isCancellationRequested || document.getText().length > MAX_DOCUMENT_LENGTH)
          return [];
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length),
        );
        return edit(document, fullRange, options(document));
      },
    }),
    vscode.languages.registerDocumentRangeFormattingEditProvider(selector, {
      provideDocumentRangeFormattingEdits(document, selected, _options, cancellation) {
        if (cancellation.isCancellationRequested || document.getText().length > MAX_DOCUMENT_LENGTH)
          return [];
        // Work on whole physical lines rather than fragments of quoted command bodies.
        const lastLine =
          selected.end.character === 0 && selected.end.line > selected.start.line
            ? selected.end.line - 1
            : selected.end.line;
        const range = new vscode.Range(
          document.lineAt(selected.start.line).range.start,
          document.lineAt(lastLine).range.end,
        );
        return edit(document, range, {
          ...options(document),
          separateSections: false,
          insertFinalNewline: false,
        });
      },
    }),
  );
}
