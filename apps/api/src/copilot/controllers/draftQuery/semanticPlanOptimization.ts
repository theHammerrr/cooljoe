import { IntentSketch } from './intentSketch';
import { JoinGraphEdge } from './models';
import { StructuredSemanticQueryPlan } from '../../services/queryCompiler/types';
import {
    CandidateColumnInfo,
    collectReferencedTables,
    dedupeNodes,
    dedupeStrings,
    expandStarSelects,
    normalizeLimit,
    pruneUnusedJoins
} from './semanticPlanOptimizationHelpers';

export function optimizeSemanticPlan(
    plan: StructuredSemanticQueryPlan,
    intentSketch?: IntentSketch,
    joinGraph: JoinGraphEdge[] = [],
    candidateColumnInfo?: CandidateColumnInfo
): StructuredSemanticQueryPlan {
    const optimizedSelect = dedupeNodes(plan.select);
    const optimizedFilters = dedupeNodes(plan.filters || []);
    const optimizedGroupBy = dedupeNodes(plan.groupBy || []);
    const optimizedOrderBy = dedupeNodes(plan.orderBy || []);
    const referencedTables = collectReferencedTables({
        ...plan,
        select: optimizedSelect,
        filters: optimizedFilters,
        groupBy: optimizedGroupBy,
        orderBy: optimizedOrderBy
    });
    const optimizedJoins = pruneUnusedJoins(plan.joins || [], referencedTables, joinGraph);
    const optimizedLimit = normalizeLimit(plan.limit, intentSketch);
    const optimizedRiskFlags = dedupeStrings(plan.riskFlags || []);
    const expandedSelect = expandStarSelects(optimizedSelect, candidateColumnInfo);

    return {
        ...plan,
        select: expandedSelect,
        joins: optimizedJoins.length > 0 ? optimizedJoins : undefined,
        filters: optimizedFilters.length > 0 ? optimizedFilters : undefined,
        groupBy: optimizedGroupBy.length > 0 ? optimizedGroupBy : undefined,
        orderBy: optimizedOrderBy.length > 0 ? optimizedOrderBy : undefined,
        limit: optimizedLimit,
        riskFlags: optimizedRiskFlags.length > 0 ? optimizedRiskFlags : undefined
    };
}
