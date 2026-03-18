import type { QueryAnalysisJoin, QueryAnalysisPredicate, QueryAnalysisSort } from './types';
import { extractQuerySqlFragments } from './queryAnalysisSqlReferences';

export function getSelectSqlReferences(sql: string): string[] {
    const fragments = extractQuerySqlFragments(sql);

    return compact([fragments.selectClause]);
}

export function getPredicateSqlReferences(sql: string, predicate: QueryAnalysisPredicate): string[] {
    const fragments = extractQuerySqlFragments(sql);
    const whereFragment = findFragmentByTerms([fragments.whereClause], [
        predicate.column,
        predicate.operator === 'LIKE' ? 'like' : undefined,
        predicate.usesFunction ? 'lower' : undefined
    ]);

    return compact([whereFragment || fragments.whereClause]);
}

export function getJoinSqlReferences(sql: string, join: QueryAnalysisJoin): string[] {
    const fragments = extractQuerySqlFragments(sql);
    const joinFragment = findFragmentByTerms(fragments.joinClauses, [
        join.leftColumn,
        join.rightColumn
    ]);

    return compact([joinFragment, fragments.whereClause]);
}

export function getSortSqlReferences(sql: string, sort: QueryAnalysisSort): string[] {
    const fragments = extractQuerySqlFragments(sql);
    const orderFragment = findFragmentByTerms([fragments.orderByClause], [
        sort.column,
        sort.direction
    ]);

    return compact([orderFragment || fragments.orderByClause]);
}

function findFragmentByTerms(fragments: Array<string | undefined>, terms: Array<string | undefined>): string | undefined {
    const normalizedTerms = terms
        .filter((term): term is string => typeof term === 'string' && term.length > 0)
        .map((term) => term.toLowerCase());

    if (normalizedTerms.length === 0) {
        return undefined;
    }

    return fragments.find((fragment) => {
        if (!fragment) return false;
        const normalizedFragment = fragment.toLowerCase();

        return normalizedTerms.every((term) => normalizedFragment.includes(term));
    });
}

function compact(values: Array<string | undefined>): string[] {
    return values.filter((value): value is string => typeof value === 'string' && value.length > 0);
}
