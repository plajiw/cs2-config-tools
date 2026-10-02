/** Bounded, read-only KeyValues subset. No CFG execution or game enum assumptions. */
export interface VideoField {
  key: string;
  value: string;
}
export interface VideoSettings {
  fields: VideoField[];
  issues: string[];
  resolution?: { width: number; height: number; aspectRatio: string };
  refreshRate?: { numerator: number; denominator: number; hz: number };
}

export const videoSettingDefinitions = Object.freeze(
  [
    { key: 'setting.defaultres', en: 'Width', pt: 'Largura', category: 'display' },
    { key: 'setting.defaultresheight', en: 'Height', pt: 'Altura', category: 'display' },
    {
      key: 'setting.refreshrate_numerator',
      en: 'Refresh numerator',
      pt: 'Numerador da frequência',
      category: 'display',
    },
    {
      key: 'setting.refreshrate_denominator',
      en: 'Refresh denominator',
      pt: 'Denominador da frequência',
      category: 'display',
    },
    { key: 'setting.fullscreen', en: 'Fullscreen', pt: 'Tela cheia', category: 'display' },
    { key: 'setting.mat_vsync', en: 'V-Sync', pt: 'V-Sync', category: 'graphics' },
    { key: 'setting.msaa_samples', en: 'MSAA samples', pt: 'Amostras MSAA', category: 'graphics' },
  ].map((definition) =>
    Object.freeze({
      ...definition,
      editable: false,
      confidence: 'unverified' as const,
      source:
        'User-supplied userdata proposal; labels identify keys, enum meanings are unverified.',
    }),
  ),
);

export function parseVideoSettings(text: string): VideoSettings {
  const result: VideoSettings = { fields: [], issues: [] };
  if (text.length > 256_000) {
    result.issues.push('size-limit');
    return result;
  }
  const tokens: string[] = [];
  let offset = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  while (offset < text.length) {
    const tail = text.slice(offset);
    const whitespace = /^\s+/.exec(tail);
    if (whitespace) {
      offset += whitespace[0].length;
      continue;
    }
    if (tail.startsWith('//')) {
      const end = text.indexOf('\n', offset);
      offset = end < 0 ? text.length : end;
      continue;
    }
    if (tail[0] === '{' || tail[0] === '}') {
      tokens.push(tail[0]);
      offset++;
      continue;
    }
    const quoted = /^"([^"\r\n]*)"/.exec(tail);
    if (!quoted || quoted[1].includes('\\')) {
      result.issues.push('unsupported-or-malformed-text');
      return result;
    }
    tokens.push('"' + quoted[1]);
    offset += quoted[0].length;
  }
  if (
    tokens.length < 3 ||
    !tokens[0].startsWith('"') ||
    tokens[1] !== '{' ||
    tokens.at(-1) !== '}'
  ) {
    result.issues.push('invalid-root');
    return result;
  }
  const seen = new Set<string>();
  for (let index = 2; index < tokens.length - 1; index += 2) {
    const key = tokens[index],
      value = tokens[index + 1];
    if (!key?.startsWith('"') || !value?.startsWith('"')) {
      result.issues.push('unsupported-structure');
      break;
    }
    const field = { key: key.slice(1), value: value.slice(1) };
    result.fields.push(field);
    if (seen.has(field.key.toLowerCase())) result.issues.push('duplicate-key');
    seen.add(field.key.toLowerCase());
  }
  // Never derive a falsely certain result from conflicting or incomplete input.
  if (result.issues.length) return result;
  const integer = (key: string) => {
    const raw = result.fields.find((field) => field.key.toLowerCase() === key)?.value;
    if (!raw || !/^\d+$/.test(raw)) return undefined;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  };
  const width = integer('setting.defaultres'),
    height = integer('setting.defaultresheight');
  if (width && height) {
    let a = width,
      b = height;
    while (b) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    result.resolution = { width, height, aspectRatio: `${width / a}:${height / a}` };
  }
  const numerator = integer('setting.refreshrate_numerator'),
    denominator = integer('setting.refreshrate_denominator');
  if (numerator && denominator)
    result.refreshRate = { numerator, denominator, hz: numerator / denominator };
  return result;
}

export function videoRows(
  model: VideoSettings,
  pt: boolean,
): Array<{ key: string; label: string; value: string }> {
  return model.fields.map((field) => {
    const definition = videoSettingDefinitions.find((item) => item.key === field.key.toLowerCase());
    return { ...field, label: definition ? (pt ? definition.pt : definition.en) : field.key };
  });
}
