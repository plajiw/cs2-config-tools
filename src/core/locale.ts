export function descriptionLanguage(setting: string, editorLanguage: string): 'en' | 'pt-BR' {
  return setting === 'pt-BR' || (setting === 'auto' && editorLanguage.toLowerCase() === 'pt-br')
    ? 'pt-BR'
    : 'en';
}
