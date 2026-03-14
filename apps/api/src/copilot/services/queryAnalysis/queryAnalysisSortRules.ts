import { classifyIndexCoverage, normalizeColumn } from './queryAnalysisIndexMatching';
import { getSortSqlReferences } from './queryAnalysisFindingSqlReferences';
import type {
    QueryAnalysisFinding,
    QueryAnalysisIndexMetadata,
    QueryAnalysisPredicate,
    QueryAnalysisSort,
    QueryAnalysisTableStats
} from './types';
import {
    formatEstimatedRowsEvidence,
    getEstimatedTableRows,
    shouldEscalateMetadataFinding,
    shouldSuppressMetadataFinding
} from './queryAnalysisTableStats';

export function buildSortFindings(
    sql: string,
    sorts: QueryAnalysisSort[],
    predicates: QueryAnalysisPredicate[],
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];

    for (const sort of sorts) {
        if (!sort.table || !sort.column) continue;
        const estimatedTableRows = getEstimatedTableRows(tableStats, sort.table);

        if (shouldSuppressMetadataFinding(estimatedTableRows)) {
            continue;
        }

        const tablePredicates = predicates.filter((predicate) => predicate.table === sort.table && predicate.column && !predicate.usesFunction);
        const filterColumns = tablePredicates.map((predicate) => normalizeColumn(predicate.column || ''));
        const indexMatch = classifyIndexCoverage(indexes, sort.table, sort.column);
        const severity = shouldEscalateMetadataFinding(estimatedTableRows) ? 'high' : 'medium';
        const rowEvidence = formatEstimatedRowsEvidence(estimatedTableRows);

        if (indexMatch.leading.length > 0 || hasAlignedFilterOrderIndex(indexMatch.any, filterColumns, sort.column)) {
            continue;
        }

        if (indexMatch.any.length > 0) {
            findings.push({
                severity,
                category: 'sort',
                title: `Existing index may not align with filter/order sequence for ${sort.table}.${sort.column}`,
                evidence: [
                    `The query sorts by ${sort.table}.${sort.column}${sort.direction ? ` ${sort.direction}` : ''}.`,
                    `Indexes reference ${sort.column}, but the composite index order does not line up with the current filter columns.`,
                    `Candidate indexes: ${indexMatch.any.map((index) => index.indexName).join(', ')}.`,
                    ...rowEvidence
                ],
                evidenceSources: ['metadata', 'sql_shape'],
                sqlReferences: getSortSqlReferences(sql, sort),
                suggestion: `Consider an index whose leading columns match the filter columns and whose next column is ${sort.column}, or rewrite the query to align with the existing index order.`,
                confidence: 'medium',
                isHeuristic: true
            });

            continue;
        }

        findings.push({
            severity,
            category: 'sort',
            title: `Sort on ${sort.table}.${sort.column} has no obvious index support`,
            evidence: [
                `The query sorts by ${sort.table}.${sort.column}${sort.direction ? ` ${sort.direction}` : ''}, but no matching index metadata references that column on the table.`,
                ...rowEvidence
            ],
            evidenceSources: ['metadata', 'sql_shape'],
            sqlReferences: getSortSqlReferences(sql, sort),
            suggestion: `If this sort is frequent and expensive, consider adding an index that supports ordering by ${sort.column}, ideally after any highly selective filter columns.`,
            confidence: 'medium',
            isHeuristic: true
        });
    }

    return findings;
}

function hasAlignedFilterOrderIndex(indexes: QueryAnalysisIndexMetadata[], filterColumns: string[], sortColumn: string): boolean {
    const normalizedSortColumn = normalizeColumn(sortColumn);

    return indexes.some((index) => {
        const position = index.normalizedColumns.findIndex((column) => column.includes(normalizedSortColumn));

        if (position < 0) return false;
        const prefix = index.normalizedColumns.slice(0, position);

        return prefix.every((column) => filterColumns.includes(column));
    });
}
