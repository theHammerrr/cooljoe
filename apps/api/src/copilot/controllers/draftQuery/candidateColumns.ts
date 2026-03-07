import { normalizeIdentifier } from './common';
import { RankedCandidateColumn } from './candidateScope';
import { TableCatalogRow } from './models';

const MAX_COLUMNS_PER_TABLE = 8;

export function buildCandidateColumnsByTable(
    rankedColumns: RankedCandidateColumn[],
    narrowedCatalog: TableCatalogRow[],
    explicitlyMentionedColumns: string[] = []
): Record<string, string[]> {
    const byTable: Record<string, string[]> = {};
    const explicitColumnSet = new Set(explicitlyMentionedColumns.map(normalizeIdentifier));

    for (const row of narrowedCatalog) {
        const table = normalizeIdentifier(row.table);

        byTable[table] = row.columns
            .map(normalizeIdentifier)
            .filter((column) => explicitColumnSet.has(column))
            .slice(0, MAX_COLUMNS_PER_TABLE);
    }

    for (const candidate of rankedColumns) {
        const current = byTable[candidate.table] || [];

        if (current.length >= MAX_COLUMNS_PER_TABLE || current.includes(candidate.column)) continue;

        current.push(candidate.column);
        byTable[candidate.table] = current;
    }

    for (const row of narrowedCatalog) {
        const table = normalizeIdentifier(row.table);
        const current = byTable[table] || [];

        if (current.length === 0) {
            byTable[table] = row.columns.slice(0, Math.min(MAX_COLUMNS_PER_TABLE, row.columns.length)).map(normalizeIdentifier);
        }
    }

    return byTable;
}
