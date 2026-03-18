import type { QueryAnalysisIndexMetadata } from './types';

export interface QueryAnalysisIndexCoverage {
    any: QueryAnalysisIndexMetadata[];
    leading: QueryAnalysisIndexMetadata[];
}

export function classifyIndexCoverage(indexes: QueryAnalysisIndexMetadata[], table: string, column: string): QueryAnalysisIndexCoverage {
    const normalizedColumn = normalizeColumn(column);
    const tableIndexes = indexes.filter((index) => `${index.schemaName}.${index.tableName}` === table);
    const any = tableIndexes.filter((index) => index.normalizedColumns.some((candidate) => candidate.includes(normalizedColumn)));
    const leading = any.filter((index) => index.normalizedColumns[0]?.includes(normalizedColumn));

    return { any, leading };
}

export function normalizeColumn(value: string): string {
    return value.replace(/"/g, '').replace(/\s+/g, '').toLowerCase();
}
