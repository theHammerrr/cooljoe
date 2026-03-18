export interface KnowledgeSourceRecord {
    type: string;
    term: string;
    definition: string;
    metadata?: Record<string, unknown>;
}

export interface NormalizedKnowledgeEntry extends KnowledgeSourceRecord {
    source: 'file' | 'db_comment' | 'accepted_query';
    sourceKey: string;
}

export interface KnowledgeImportResult {
    imported: number;
    updated: number;
    skipped: number;
    files: string[];
    errors: string[];
}

export interface KnowledgeRetrievalOptions {
    limit?: number;
    schema?: string;
    tables?: string[];
    columns?: string[];
    types?: string[];
}

export interface RetrievedKnowledgeDoc {
    id: string;
    term: string;
    definition: string;
    type: string;
    metadata: Record<string, unknown> | null;
    score: number;
}

export interface RetrievedRecipe {
    id: string;
    intent: string;
    sqlQuery: string;
    prismaQuery: string | null;
    tags: string[];
    metadata: Record<string, unknown> | null;
    score: number;
}
