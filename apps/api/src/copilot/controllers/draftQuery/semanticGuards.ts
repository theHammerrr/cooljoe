import { DraftDiagnostic } from './diagnostics';
import {
    asksForCount,
    asksForNames,
    asksForTimeBucket,
    asksForTimeRange,
    asksForTopN,
    hasAggregation,
    hasLimit,
    hasOrderBy,
    hasTimeBucket,
    hasTimeFilter
} from './semanticIntent';

function normalizeSql(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function detectSemanticDraftIssues(
    question: string,
    sql: string,
    deterministicCandidate?: { confidence: number; sql: string }
): DraftDiagnostic[] {
    const issues: DraftDiagnostic[] = [];

    if (deterministicCandidate && deterministicCandidate.confidence < 0.75) {
        const generated = normalizeSql(sql);
        const candidate = normalizeSql(deterministicCandidate.sql);

        if (generated === candidate) {
            issues.push({
                code: 'LOW_CONFIDENCE_ECHO',
                message: 'Generated SQL echoed low-confidence deterministic candidate without resolving missing intent.'
            });
        }
    }

    if (asksForNames(question)) {
        const normalized = normalizeSql(sql);
        const hasNameColumn = normalized.includes('first_name') || normalized.includes('last_name') || normalized.includes('"name"');
        const isWildcardEmployee = normalized.includes('"employee".*') || normalized.includes(' employee.*');

        if (isWildcardEmployee && !hasNameColumn) {
            issues.push({
                code: 'MISSING_NAME_COLUMNS',
                message: 'Prompt asks for names but SQL only selects employee.* without explicit name columns.'
            });
        }
    }

    if (asksForCount(question) && !hasAggregation(sql)) {
        issues.push({
            code: 'MISSING_AGGREGATION',
            message: 'Prompt asks for a count, but SQL does not include an aggregate function.'
        });
    }

    if (asksForTopN(question)) {
        if (!hasOrderBy(sql)) {
            issues.push({
                code: 'MISSING_ORDER_BY',
                message: 'Prompt asks for a ranked or top-N result, but SQL does not include ORDER BY.'
            });
        }

        if (!hasLimit(sql)) {
            issues.push({
                code: 'MISSING_LIMIT',
                message: 'Prompt asks for a ranked or top-N result, but SQL does not include LIMIT.'
            });
        }
    }

    if (asksForTimeBucket(question) && !hasTimeBucket(sql)) {
        issues.push({
            code: 'MISSING_TIME_BUCKET',
            message: 'Prompt asks for time-based grouping, but SQL does not bucket results by time.'
        });
    }

    if (asksForTimeRange(question) && !hasTimeFilter(sql)) {
        issues.push({
            code: 'MISSING_TIME_FILTER',
            message: 'Prompt asks for a time range, but SQL does not include a time-based filter.'
        });
    }

    return issues;
}

export function detectSemanticDraftIssue(
    question: string,
    sql: string,
    deterministicCandidate?: { confidence: number; sql: string }
): DraftDiagnostic | null {
    return detectSemanticDraftIssues(question, sql, deterministicCandidate)[0] ?? null;
}
