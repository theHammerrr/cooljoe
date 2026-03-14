import { buildJoinFindings } from './queryAnalysisJoinRules';
import { buildPredicateFindings } from './queryAnalysisPredicateRules';
import type { QueryAnalysisFinding, QueryAnalysisIndexMetadata, QueryAnalysisJoin, QueryAnalysisPredicate, QueryAnalysisTableStats } from './types';

export function buildIndexFindings(
    predicates: QueryAnalysisPredicate[],
    joins: QueryAnalysisJoin[],
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): QueryAnalysisFinding[] {
    return [...buildPredicateFindings(predicates, indexes, tableStats), ...buildJoinFindings(joins, indexes, tableStats)];
}
