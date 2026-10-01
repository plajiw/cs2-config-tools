import { Catalog, CatalogEntry } from './types';

/** A reviewed boolean meaning also describes its numeric spelling. */
export function parameterMeaning(
  entry: CatalogEntry | undefined,
  value: string,
  language: 'en' | 'pt-BR',
): string | undefined {
  const canonical = (literal: string) =>
    literal === '0' ? 'false' : literal === '1' ? 'true' : literal;
  const option = entry?.parameter?.values?.find(
    (option) =>
      option.value === value ||
      (entry.parameter?.type === 'boolean' && canonical(option.value) === canonical(value)),
  );
  return language === 'pt-BR' ? (option?.['pt-BR'] ?? option?.en) : option?.en;
}

/** Shared lookup and visibility policy; runtime/editor adapters do not infer flags. */
export class CommandRegistry {
  readonly entries: ReadonlyMap<string, CatalogEntry>;
  constructor(readonly catalog: Catalog) {
    const entries = new Map<string, CatalogEntry>();
    for (const entry of catalog.entries) {
      if (entries.has(entry.name)) throw new Error(`Duplicate catalog symbol: ${entry.name}`);
      entries.set(entry.name, entry);
    }
    this.entries = entries;
  }
  get(name: string): CatalogEntry | undefined {
    return this.entries.get(name);
  }
  reportedRejections(profile: string): ReadonlySet<string> {
    return new Set(
      this.catalog.entries
        .filter((entry) => entry.reportedRejection === profile)
        .map((entry) => entry.name),
    );
  }
  valueLabel(name: string, value: string, language: 'en' | 'pt-BR'): string | undefined {
    return parameterMeaning(this.get(name), value, language);
  }
  suggestions(mode: 'normal' | 'advanced' = 'normal', convarsOnly = false): CatalogEntry[] {
    return this.catalog.entries.filter(
      (entry) =>
        (!convarsOnly || entry.kind !== 'command') &&
        (mode === 'advanced' ||
          !(entry.rawFlags ?? []).some((flag) =>
            ['hidden', 'developmentonly', 'internal'].includes(flag),
          )),
    );
  }
}
