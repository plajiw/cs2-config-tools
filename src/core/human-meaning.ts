import { CatalogEntry } from '../catalog/types';

/** Only reviewed literal action shapes receive a whole-action meaning. */
export function supportsActionMeaning(
  entry: CatalogEntry | undefined,
  parameters: readonly string[],
): boolean {
  return !entry?.editorial.meaning || parameters.length === 0;
}

export function actionMeaning(
  entry: CatalogEntry | undefined,
  parameters: readonly string[],
  language: 'en' | 'pt-BR',
) {
  return humanMeaning(supportsActionMeaning(entry, parameters) ? entry : undefined, language);
}

/** Community explanations stay separate from original help and runtime existence. */
export function humanMeaning(entry: CatalogEntry | undefined, language: 'en' | 'pt-BR') {
  const meaning = entry?.editorial.meaning;
  const label =
    meaning?.strength === 'high' ? meaning.label[language] || meaning.label.en : undefined;
  const description = entry?.editorial[language] || entry?.editorial.en || '';
  return {
    label,
    title: meaning?.strength === 'tentative' ? entry?.name : label || description,
    description,
    category: entry?.editorial.category || 'custom',
    evidence: meaning,
  };
}
