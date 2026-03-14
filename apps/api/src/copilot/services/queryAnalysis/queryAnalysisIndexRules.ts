import { buildJoinFindings } from './queryAnalysisJoinRules';
import { buildPredicateFindings } from './queryAnalysisPredicateRules';
import type { QueryAnalysisFinding, QueryAnalysisIndexMetadata, QueryAnalysisJoin, QueryAnalysisPredicate, QueryAnalysisTableStats } from './types';

export function buildIndexFindings(
    sql: string,
    predicates: QueryAnalysisPredicate[],
    joins: QueryAnalysisJoin[],
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): QueryAnalysisFinding[] {
    return [...buildPredicateFindings(sql, predicates, indexes, tableStats), ...buildJoinFindings(sql, joins, indexes, tableStats)];
}
