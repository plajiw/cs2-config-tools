export interface CatalogEntry {
  name: string;
  kind: 'command' | 'convar' | 'unknown';
  catalogStatus: 'discovered' | 'verified' | 'curated';
  lifecycle: 'active' | 'deprecated' | 'legacy' | 'removed' | 'unknown';
  documentation: { reviewed: boolean };
  provenance: Record<string, { source: string; confidence: 'community' | 'snapshot-verified' }>;
  runtime?: {
    present: boolean;
    revision: string;
    gameBuild: string | null;
    verifiedInGame: boolean;
  };
  technical?: {
    name: string;
    kind: 'command' | 'convar';
    flags: string[];
    dumpValue?: string;
    min?: number;
    max?: number;
    enumName?: string;
    description: string | null;
    sourceId: string;
  };
  original: { text: string } | null;
  editorial: { en: string; 'pt-BR'?: string };
  verification: string;
  requiresCheats: string;
  examples: string[][];
  reportedRejection: string | null;
  parameter?: {
    type: 'integer' | 'number' | 'boolean';
    default?: string;
    min?: number;
    max?: number;
    values?: { value: string; en: string; 'pt-BR'?: string }[];
  };
  documentationExamples?: { arguments: string[]; en: string; 'pt-BR'?: string }[];
  documentationSource?: { title: string; url: string; snapshotDate: string };
  compatibility?: { status: 'hidden'; replacement: string };
  rawFlags?: string[];
}

export interface Catalog {
  schemaVersion: number;
  version: string;
  entries: CatalogEntry[];
  sources: Record<
    string,
    {
      title?: string;
      url?: string;
      snapshotDate?: string;
      revision?: string;
      buildId?: string | null;
    }
  >;
}
