import type { QueryAnalysisFinding, QueryAnalysisIndexMetadata, QueryAnalysisJoin, QueryAnalysisPredicate } from './types';

export function buildIndexFindings(predicates: QueryAnalysisPredicate[], joins: QueryAnalysisJoin[], indexes: QueryAnalysisIndexMetadata[]): QueryAnalysisFinding[] {
    return [
        ...buildPredicateFindings(predicates, indexes),
        ...buildJoinFindings(joins, indexes)
    ];
}

function buildPredicateFindings(predicates: QueryAnalysisPredicate[], indexes: QueryAnalysisIndexMetadata[]): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];

    for (const predicate of predicates) {
        if (!predicate.table || !predicate.column) continue;
        const relatedIndexes = findIndexesForColumn(indexes, predicate.table, predicate.column);

        if (predicate.usesFunction) {
            findings.push({
                severity: 'medium',
                category: 'index',
                title: `Function-wrapped predicate on ${predicate.table}.${predicate.column}`,
                evidence: [`Predicate operator: ${predicate.operator}.`, `The filtered column is wrapped in a function expression, which can prevent normal index usage.`],
                suggestion: relatedIndexes.length > 0
                    ? `Rewrite the predicate to compare ${predicate.table}.${predicate.column} directly when possible, or add an expression index if the function is required.`
                    : `Avoid wrapping ${predicate.table}.${predicate.column} in a function, or add an expression index if that expression is required.`,
                confidence: 'high',
                isHeuristic: false
            });
        }

        if (predicate.hasLeadingWildcard) {
            findings.push({
                severity: 'medium',
                category: 'index',
                title: `Leading wildcard LIKE on ${predicate.table}.${predicate.column}`,
                evidence: ['The pattern starts with `%`, which prevents standard btree prefix matching.'],
                suggestion: 'Avoid a leading wildcard if possible, or consider trigram / full-text search support for this lookup pattern.',
                confidence: 'high',
                isHeuristic: false
            });
        }

        if (!predicate.usesFunction && !predicate.hasLeadingWildcard && relatedIndexes.length === 0) {
            findings.push({
                severity: 'medium',
                category: 'index',
                title: `No supporting index found for filter on ${predicate.table}.${predicate.column}`,
                evidence: [`Predicate operator: ${predicate.operator}.`, `No existing index definition starts with or references ${predicate.column} on ${predicate.table}.`],
                suggestion: `Consider adding an index that begins with ${predicate.column} on ${predicate.table} if this predicate is selective and performance-critical.`,
                confidence: 'medium',
                isHeuristic: true
            });
        }
    }

    return findings;
}

function buildJoinFindings(joins: QueryAnalysisJoin[], indexes: QueryAnalysisIndexMetadata[]): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];

    for (const join of joins) {
        if (join.leftTable && join.leftColumn && findIndexesForColumn(indexes, join.leftTable, join.leftColumn).length === 0) {
            findings.push(buildJoinIndexFinding(join.leftTable, join.leftColumn));
        }

        if (join.rightTable && join.rightColumn && findIndexesForColumn(indexes, join.rightTable, join.rightColumn).length === 0) {
            findings.push(buildJoinIndexFinding(join.rightTable, join.rightColumn));
        }
    }

    return findings;
}

function buildJoinIndexFinding(table: string, column: string): QueryAnalysisFinding {
    return {
        severity: 'medium',
        category: 'join',
        title: `Join key ${table}.${column} lacks obvious index support`,
        evidence: [`The join references ${table}.${column}, but no matching index metadata was found for that column.`],
        suggestion: `Review whether ${table}.${column} should be indexed to support the join pattern, especially on large tables or foreign-key style relationships.`,
        confidence: 'medium',
        isHeuristic: true
    };
}

function findIndexesForColumn(indexes: QueryAnalysisIndexMetadata[], table: string, column: string): QueryAnalysisIndexMetadata[] {
    return indexes.filter((index) => `${index.schemaName}.${index.tableName}` === table && index.columns.some((candidate) => normalizeIndexColumn(candidate).includes(column.toLowerCase())));
}

function normalizeIndexColumn(value: string): string {
    return value.replace(/"/g, '').toLowerCase();
}
