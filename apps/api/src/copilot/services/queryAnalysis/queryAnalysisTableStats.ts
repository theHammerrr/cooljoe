import type { QueryAnalysisTableStats } from './types';

const SMALL_TABLE_ROW_THRESHOLD = 1000;
const LARGE_TABLE_ROW_THRESHOLD = 50000;

export function getEstimatedTableRows(tableStats: QueryAnalysisTableStats[], table: string): number | undefined {
    const directMatch = tableStats.find((entry) => `${entry.schemaName}.${entry.tableName}` === table);

    if (directMatch) {
        return directMatch.estimatedRows;
    }

    const unqualifiedTableName = table.includes('.') ? table.split('.').at(-1) : table;
    const unqualifiedMatch = tableStats.find((entry) => entry.tableName === unqualifiedTableName);

    return unqualifiedMatch?.estimatedRows;
}

export function shouldSuppressMetadataFinding(estimatedRows: number | undefined): boolean {
    return typeof estimatedRows === 'number' && estimatedRows < SMALL_TABLE_ROW_THRESHOLD;
}

export function shouldEscalateMetadataFinding(estimatedRows: number | undefined): boolean {
    return typeof estimatedRows === 'number' && estimatedRows > LARGE_TABLE_ROW_THRESHOLD;
}

export function formatEstimatedRowsEvidence(estimatedRows: number | undefined): string[] {
    if (typeof estimatedRows !== 'number') {
        return [];
    }

    return [`Estimated table rows: ${Math.round(estimatedRows)}.`];
}
