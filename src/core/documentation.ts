import { CatalogEntry } from '../catalog/types';
import { parameterMeaning } from '../catalog/registry';

export type DocumentationBlock =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'field'; label: string; value: string }
  | { kind: 'heading'; text: string }
  | { kind: 'values'; rows: { value: string; meaning: string }[]; headings: [string, string] }
  | { kind: 'link'; label: string; url: string };
export interface DocumentationOptions {
  language: 'en' | 'pt-BR';
  showOriginal?: boolean;
  currentArguments?: string[];
  advanced?: boolean;
}

/** Facts and translations are shared; each client renders these blocks safely. */
export function documentation(
  entry: CatalogEntry,
  options: DocumentationOptions,
): DocumentationBlock[] {
  const pt = options.language === 'pt-BR';
  const label = (en: string, br: string) => (pt ? br : en);
  const translatedText = pt ? entry.editorial['pt-BR'] : entry.editorial.en;
  const text = translatedText || entry.editorial.en || entry.original?.text || '';
  const blocks: DocumentationBlock[] = [
    { kind: 'code', text: entry.name },
    { kind: 'text', text: text || label('No description available.', 'Descrição indisponível.') },
  ];
  const technical = entry.technical;
  const parameter = entry.parameter;
  const field = (title: string, value: string) =>
    blocks.push({ kind: 'field', label: title, value });
  const valueMeaning = (value: string) => {
    const meaning = parameterMeaning(entry, value, options.language);
    const display = value === '' ? '""' : value;
    return meaning ? `${display} — ${meaning}` : display;
  };
  if (entry.kind === 'convar' && options.currentArguments?.length === 1)
    field(label('Current value', 'Valor atual'), valueMeaning(options.currentArguments[0]));
  if (parameter?.default !== undefined)
    field(label('Default', 'Padrão'), valueMeaning(parameter.default));
  const min = technical?.min ?? parameter?.min;
  const max = technical?.max ?? parameter?.max;
  if (min !== undefined || max !== undefined)
    field(
      label('Allowed range', 'Intervalo permitido'),
      min !== undefined && max !== undefined
        ? `${min} ${label('to', 'a')} ${max}`
        : min !== undefined
          ? `${label('Minimum', 'Mínimo')}: ${min}`
          : `${label('Maximum', 'Máximo')}: ${max}`,
    );
  if (parameter) {
    if (parameter.values?.length)
      blocks.push({ kind: 'heading', text: label('Values', 'Valores') });
    if (parameter.values?.length)
      blocks.push({
        kind: 'values',
        headings: [label('Value', 'Valor'), label('Meaning', 'Significado')],
        rows: parameter.values.map((value) => ({
          value: value.value,
          meaning: pt ? value['pt-BR'] || value.en : value.en,
        })),
      });
  }
  const example = entry.documentationExamples?.find(
    (example) =>
      JSON.stringify(example.arguments) !== JSON.stringify(options.currentArguments) &&
      example.arguments.every((value) => !/["\r\n]/.test(value)),
  );
  if (example) {
    blocks.push({
      kind: 'text',
      text: `${label('Example', 'Exemplo')} — ${pt ? example['pt-BR'] || example.en : example.en}`,
    });
    blocks.push({
      kind: 'code',
      text: [entry.name, ...example.arguments.map((value) => `"${value}"`)].join(' '),
    });
  }
  const flags = technical?.flags ?? entry.rawFlags;
  const observed =
    technical?.dumpValue !== undefined &&
    (options.advanced ||
      parameter?.default === undefined ||
      technical.dumpValue !== parameter.default);
  if (flags?.length || options.advanced || observed)
    blocks.push({ kind: 'heading', text: label('Technical details', 'Detalhes técnicos') });
  if (options.advanced) {
    field(
      label('Kind', 'Categoria'),
      entry.kind === 'convar'
        ? 'ConVar'
        : entry.kind === 'command'
          ? label('Command', 'Comando')
          : label('Unknown', 'Desconhecido'),
    );
    if (parameter)
      field(
        label('Parameter type', 'Tipo do parâmetro'),
        parameter.type === 'integer'
          ? label('Integer', 'Inteiro')
          : parameter.type === 'boolean'
            ? label('Boolean', 'Booleano')
            : label('Number', 'Número'),
      );
  }
  if (observed) field(label('Observed value', 'Valor observado'), technical!.dumpValue!);
  if (flags?.length) field('Flags', flags.join(', '));
  if (entry.runtime?.gameBuild)
    field(label('Reference build', 'Build de referência'), entry.runtime.gameBuild);
  if (entry.lifecycle !== 'unknown') field(label('Status', 'Estado'), entry.lifecycle);
  if (entry.documentationSource || (technical && entry.runtime))
    blocks.push({ kind: 'heading', text: label('Source', 'Fonte') });
  if (entry.documentationSource)
    blocks.push({
      kind: 'link',
      label: `${label('Reviewed source', 'Fonte revisada')} · ${entry.documentationSource.snapshotDate}`,
      url: entry.documentationSource.url,
    });
  if (technical && entry.runtime)
    blocks.push({
      kind: 'link',
      label: label('Source 2 metadata via SteamTracking', 'Metadados Source 2 via SteamTracking'),
      url: `https://github.com/SteamTracking/GameTracking-CS2/blob/${entry.runtime.revision}/DumpSource2/${entry.kind === 'command' ? 'commands' : 'convars'}.txt`,
    });
  if (entry.compatibility)
    blocks.push({
      kind: 'text',
      text: label(
        `Hidden in the referenced snapshot. Prefer ${entry.compatibility.replacement}; adjust values visually.`,
        `Oculto no snapshot de referência. Prefira ${entry.compatibility.replacement}; ajuste os valores visualmente.`,
      ),
    });
  if (pt && !translatedText && text)
    blocks.push({ kind: 'text', text: 'Tradução indisponível; exibindo inglês.' });
  if (options.showOriginal && entry.original && entry.original.text !== text)
    blocks.push({ kind: 'text', text: `Original (en): ${entry.original.text}` });
  if (options.advanced && Object.keys(entry.provenance).length) {
    blocks.push({ kind: 'heading', text: label('Field provenance', 'Proveniência por campo') });
    for (const [name, evidence] of Object.entries(entry.provenance))
      field(name, `${evidence.confidence} · ${evidence.source}`);
  }
  if (entry.reportedRejection)
    blocks.push({
      kind: 'text',
      text: label(
        'Rejected in the supplied console report; check your game build.',
        'Rejeitado no relato de console fornecido; confira a build do jogo.',
      ),
    });
  return blocks;
}
