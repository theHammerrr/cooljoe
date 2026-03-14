import { classifyIndexCoverage } from './queryAnalysisIndexMatching';
import type { QueryAnalysisFinding, QueryAnalysisIndexMetadata, QueryAnalysisPredicate, QueryAnalysisTableStats } from './types';
import {
    formatEstimatedRowsEvidence,
    getEstimatedTableRows,
    shouldEscalateMetadataFinding,
    shouldSuppressMetadataFinding
} from './queryAnalysisTableStats';

export function buildPredicateFindings(
    predicates: QueryAnalysisPredicate[],
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];

    for (const predicate of predicates) {
        if (!predicate.table || !predicate.column) continue;
        const indexMatch = classifyIndexCoverage(indexes, predicate.table, predicate.column);
        appendFunctionFinding(findings, predicate, indexMatch.any.length > 0);
        appendWildcardFinding(findings, predicate);
        appendCoverageFinding(findings, predicate, indexMatch, tableStats);
    }

    return findings;
}

function appendFunctionFinding(findings: QueryAnalysisFinding[], predicate: QueryAnalysisPredicate, hasReferencedIndex: boolean): void {
    if (!predicate.usesFunction || !predicate.table || !predicate.column) return;
    findings.push({
        severity: 'medium',
        category: 'index',
        title: `Function-wrapped predicate on ${predicate.table}.${predicate.column}`,
        evidence: [`Predicate operator: ${predicate.operator}.`, 'The filtered column is wrapped in a function expression, which can prevent normal index usage.'],
        evidenceSources: hasReferencedIndex ? ['sql_shape', 'metadata'] : ['sql_shape'],
        suggestion: hasReferencedIndex
            ? `Rewrite the predicate to compare ${predicate.table}.${predicate.column} directly when possible, or add an expression index if the function is required.`
            : `Avoid wrapping ${predicate.table}.${predicate.column} in a function, or add an expression index if that expression is required.`,
        confidence: 'high',
        isHeuristic: false
    });
}

function appendWildcardFinding(findings: QueryAnalysisFinding[], predicate: QueryAnalysisPredicate): void {
    if (!predicate.hasLeadingWildcard || !predicate.table || !predicate.column) return;
    findings.push({
        severity: 'medium',
        category: 'index',
        title: `Leading wildcard LIKE on ${predicate.table}.${predicate.column}`,
        evidence: ['The pattern starts with `%`, which prevents standard btree prefix matching.'],
        evidenceSources: ['sql_shape'],
        suggestion: 'Avoid a leading wildcard if possible, or consider trigram / full-text search support for this lookup pattern.',
        confidence: 'high',
        isHeuristic: false
    });
}

function appendCoverageFinding(
    findings: QueryAnalysisFinding[],
    predicate: QueryAnalysisPredicate,
    indexMatch: ReturnType<typeof classifyIndexCoverage>,
    tableStats: QueryAnalysisTableStats[]
): void {
    if (!predicate.table || !predicate.column || predicate.usesFunction || predicate.hasLeadingWildcard || indexMatch.leading.length > 0) return;
    const estimatedTableRows = getEstimatedTableRows(tableStats, predicate.table);

    if (shouldSuppressMetadataFinding(estimatedTableRows)) return;

    const severity = shouldEscalateMetadataFinding(estimatedTableRows) ? 'high' : 'medium';
    const rowEvidence = formatEstimatedRowsEvidence(estimatedTableRows);

    if (indexMatch.any.length > 0) {
        findings.push({
            severity,
            category: 'index',
            title: `Existing index order may not support filter on ${predicate.table}.${predicate.column}`,
            evidence: [`Predicate operator: ${predicate.operator}.`, `Matching indexes reference ${predicate.column}, but not as the leading indexed column.`, `Candidate indexes: ${indexMatch.any.map((index) => index.indexName).join(', ')}.`, ...rowEvidence],
            evidenceSources: ['metadata', 'sql_shape'],
            suggestion: `If this predicate needs fast access by ${predicate.column}, consider an index that starts with ${predicate.column} or rewrite the query to align with the existing composite index order.`,
            confidence: 'medium',
            isHeuristic: true
        });

        return;
    }

    findings.push({
        severity,
        category: 'index',
        title: `No supporting index found for filter on ${predicate.table}.${predicate.column}`,
        evidence: [`Predicate operator: ${predicate.operator}.`, `No existing index definition starts with or references ${predicate.column} on ${predicate.table}.`, ...rowEvidence],
        evidenceSources: ['metadata', 'sql_shape'],
        suggestion: `Consider adding an index that begins with ${predicate.column} on ${predicate.table} if this predicate is selective and performance-critical.`,
        confidence: 'medium',
        isHeuristic: true
    });
}
