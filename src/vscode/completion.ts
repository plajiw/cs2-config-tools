import * as vscode from 'vscode';
import { aliases } from '../core/parser';
import { completionContext } from '../core/completion';
import { CatalogEntry } from '../catalog/types';
import { Services, selector, ui } from './services';
import { markdown } from './documentation';

export function registerCompletion(services: Services): vscode.Disposable {
  const { parsed, range } = services;
  const entries = services.entries;
  return vscode.languages.registerCompletionItemProvider(
    selector,
    {
      provideCompletionItems(doc, position) {
        const p = parsed(doc),
          c = completionContext(doc.getText(), p, doc.offsetAt(position));
        if (!c) return;
        let values: { label: string; entry?: CatalogEntry; body?: string }[] = [];
        if (c.argumentIndex === 0 || (c.name === 'toggle' && c.argumentIndex === 1)) {
          const mode = services.config(doc).get<'normal' | 'advanced'>('completionMode', 'normal');
          values = services.registry
            .suggestions(mode, c.name === 'toggle' && c.argumentIndex === 1)
            .map((entry) => ({ label: entry.name, entry }));
          if (c.argumentIndex === 0)
            values.push(...[...aliases(p)].map(([label, alias]) => ({ label, body: alias.body })));
        } else if (c.name === 'buy' && c.argumentIndex === 1) {
          values = [
            'deagle',
            'vest',
            'smokegrenade',
            'm4a1',
            'ak47',
            'hegrenade',
            'awp',
            'vesthelm',
            'flashbang',
            'molotov',
            'incgrenade',
            'defuser',
          ].map((label) => ({ label }));
        } else if (c.name === 'bind' && c.argumentIndex === 1) {
          values = [
            'w',
            'a',
            's',
            'd',
            'CTRL',
            'SHIFT',
            'ALT',
            'SPACE',
            'MWHEELUP',
            'MWHEELDOWN',
            'MOUSE1',
            'MOUSE2',
            'MOUSE3',
            'q',
            'r',
            'e',
            'g',
            '1',
            '2',
            '3',
            '4',
            '5',
            'z',
            'x',
            'c',
            'v',
            'o',
            'p',
            'k',
            '`',
            'kp_1',
            'kp_0',
            'kp_divide',
            'kp_2',
            'kp_multiply',
            'kp_3',
            'kp_del',
            'kp_minus',
            'kp_plus',
            'kp_enter',
            ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`),
          ].map((label) => ({ label }));
        } else if (c.name === 'exec' && c.argumentIndex === 1) {
          values = ['autoexec.cfg', 'practice.cfg'].map((label) => ({ label }));
        } else {
          const entry = c.name ? entries.get(c.name) : undefined;
          const argumentExamples = [
            ...(entry?.documentationExamples?.map((example) => example.arguments) ?? []),
            ...(entry?.examples ?? []),
          ];
          values =
            c.argumentIndex === 1 && entry?.parameter?.values
              ? entry.parameter.values.map((value) => ({ label: value.value, entry }))
              : [
                  ...new Set(
                    argumentExamples
                      .map((e) => e[c.argumentIndex - 1])
                      .filter((v): v is string => v !== undefined) ?? [],
                  ),
                ].map((label) => ({ label }));
        }
        return values
          .filter((v) => v.label.toLowerCase().startsWith(c.prefix.toLowerCase()))
          .slice(0, 200)
          .map((value) => {
            const item = new vscode.CompletionItem(
              value.label,
              value.body !== undefined
                ? vscode.CompletionItemKind.Function
                : vscode.CompletionItemKind.Value,
            );
            item.range = range(doc, c.start, c.end);
            item.insertText = value.label;
            item.detail =
              value.body !== undefined
                ? ui('Local alias', 'Alias local')
                : ui(
                    value.entry?.kind === 'command'
                      ? 'Command'
                      : value.entry?.kind === 'convar'
                        ? 'ConVar'
                        : 'Community entry',
                    value.entry?.kind === 'command'
                      ? 'Comando'
                      : value.entry?.kind === 'convar'
                        ? 'ConVar'
                        : 'Entrada comunitária',
                  );
            if (value.entry) item.documentation = markdown(value.entry, doc);
            if (c.argumentIndex === 1 && value.entry?.parameter?.values) {
              const option = value.entry.parameter.values.find(
                (option) => option.value === value.label,
              );
              const selectedLanguage = services
                .config(doc)
                .get<string>('descriptionLanguage', 'en');
              item.detail =
                selectedLanguage === 'pt-BR' ||
                (selectedLanguage === 'auto' && vscode.env.language.toLowerCase() === 'pt-br')
                  ? (option?.['pt-BR'] ?? option?.en)
                  : option?.en;
            }
            if (!value.entry && value.body !== undefined) {
              const md = new vscode.MarkdownString();
              md.appendCodeblock(value.body, 'cs2cfg');
              item.documentation = md;
            } else if (!value.entry)
              item.documentation = ui(
                'Observed corpus value; not an exhaustive list of accepted values.',
                'Valor observado no corpus; não é uma lista completa dos valores aceitos.',
              );
            return item;
          });
      },
    },
    ' ',
    ';',
    '"',
  );
}
