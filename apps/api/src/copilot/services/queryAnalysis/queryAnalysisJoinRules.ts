import { classifyIndexCoverage } from './queryAnalysisIndexMatching';
import type { QueryAnalysisFinding, QueryAnalysisIndexMetadata, QueryAnalysisJoin, QueryAnalysisTableStats } from './types';
import {
    formatEstimatedRowsEvidence,
    getEstimatedTableRows,
    shouldEscalateMetadataFinding,
    shouldSuppressMetadataFinding
} from './queryAnalysisTableStats';

export function buildJoinFindings(
    joins: QueryAnalysisJoin[],
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];

    for (const join of joins) {
        if (join.leftTable && join.leftColumn) appendJoinCoverageFinding(findings, indexes, tableStats, join.leftTable, join.leftColumn);

        if (join.rightTable && join.rightColumn) appendJoinCoverageFinding(findings, indexes, tableStats, join.rightTable, join.rightColumn);
    }

    return findings;
}

function appendJoinCoverageFinding(
    findings: QueryAnalysisFinding[],
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[],
    table: string,
    column: string
): void {
    const indexMatch = classifyIndexCoverage(indexes, table, column);
    const estimatedTableRows = getEstimatedTableRows(tableStats, table);

    if (shouldSuppressMetadataFinding(estimatedTableRows)) {
        return;
    }

    if (indexMatch.leading.length > 0) return;

    const severity = shouldEscalateMetadataFinding(estimatedTableRows) ? 'high' : 'medium';
    const rowEvidence = formatEstimatedRowsEvidence(estimatedTableRows);

    if (indexMatch.any.length > 0) {
        findings.push({
            severity,
            category: 'join',
            title: `Join key ${table}.${column} is not the leading column of an index`,
            evidence: [
                `Indexes reference ${column}, but not as the leading indexed column. Candidate indexes: ${indexMatch.any.map((index) => index.indexName).join(', ')}.`,
                ...rowEvidence
            ],
            evidenceSources: ['metadata', 'sql_shape'],
            suggestion: `If this join is performance-critical, consider an index that starts with ${column} on ${table}, or verify that the existing composite index order matches the access pattern.`,
            confidence: 'medium',
            isHeuristic: true
        });

        return;
    }

    findings.push({
        severity,
        category: 'join',
        title: `Join key ${table}.${column} lacks obvious index support`,
        evidence: [
            `The join references ${table}.${column}, but no matching index metadata was found for that column.`,
            ...rowEvidence
        ],
        evidenceSources: ['metadata', 'sql_shape'],
        suggestion: `Review whether ${table}.${column} should be indexed to support the join pattern, especially on large tables or foreign-key style relationships.`,
        confidence: 'medium',
        isHeuristic: true
    });
}
