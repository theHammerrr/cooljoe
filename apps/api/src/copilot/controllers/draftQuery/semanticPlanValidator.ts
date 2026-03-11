import { DraftDiagnostic } from './diagnostics';
import { IntentSketch } from './intentSketch';
import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import {
    collectReferencedTables,
    hasTimeFilter,
    hasTimeGrouping,
    validateColumnScope,
    validateJoinScope
} from './semanticPlanValidationHelpers';

interface SemanticPlanValidationScope {
    candidateTables?: string[];
    candidateColumnsByTable?: Record<string, string[]>;
    allowedJoinGraph?: Array<{ fromTable: string; fromColumn: string; toTable: string; toColumn: string }>;
}

export function validateSemanticPlanAgainstIntent(
    plan: SemanticQueryPlan,
    intentSketch: IntentSketch,
    scope: SemanticPlanValidationScope = {}
): DraftDiagnostic[] {
    if (plan.requires_raw_sql) return [];

    const diagnostics: DraftDiagnostic[] = [];
    const referencedTables = collectReferencedTables(plan);
    const candidateTables = scope.candidateTables || [];
    const candidateTableSet = new Set(candidateTables);

    if (candidateTables.length > 0 && referencedTables.some((table) => !candidateTableSet.has(table))) {
        diagnostics.push({
            code: 'PLAN_OUTSIDE_CANDIDATE_SCOPE',
            message: `Plan referenced tables outside the narrowed candidate scope: ${referencedTables.filter((table) => !candidateTableSet.has(table)).join(', ')}`
        });
    }

    if (intentSketch.entities.length > 0 && !referencedTables.some((table) => intentSketch.entities.includes(table) || intentSketch.entities.some((entity) => table.endsWith(entity.split('.').slice(-1)[0])))) {
        diagnostics.push({
            code: 'PLAN_MISSING_ENTITY',
            message: 'Plan does not reference the main entity implied by the user request.'
        });
    }

    if (intentSketch.asksForCount && !plan.select.some((node) => node.agg === 'count')) {
        diagnostics.push({
            code: 'MISSING_AGGREGATION',
            message: 'Prompt asks for a count, but the semantic plan does not aggregate.'
        });
    }

    if (intentSketch.asksForTopN) {
        if (!plan.orderBy?.length) {
            diagnostics.push({
                code: 'MISSING_ORDER_BY',
                message: 'Prompt asks for a ranked result, but the semantic plan does not specify ORDER BY.'
            });
        }

        if (plan.limit === undefined) {
            diagnostics.push({
                code: 'MISSING_LIMIT',
                message: 'Prompt asks for a ranked result, but the semantic plan does not specify LIMIT.'
            });
        } else if (intentSketch.rankingLimit && plan.limit > intentSketch.rankingLimit) {
            diagnostics.push({
                code: 'MISSING_LIMIT',
                message: `Prompt asks for top ${intentSketch.rankingLimit}, but the semantic plan limit is ${plan.limit}.`
            });
        }
    }

    if (intentSketch.asksForTimeBucket && !hasTimeGrouping(plan)) {
        diagnostics.push({
            code: 'MISSING_TIME_BUCKET',
            message: 'Prompt asks for time-based grouping, but the semantic plan does not group by a time column.'
        });
    }

    if (intentSketch.asksForTimeRange && !hasTimeFilter(plan)) {
        diagnostics.push({
            code: 'MISSING_TIME_FILTER',
            message: 'Prompt asks for a time range, but the semantic plan does not filter on a time column.'
        });
    }

    diagnostics.push(...validateColumnScope(plan, scope.candidateColumnsByTable || {}));
    diagnostics.push(...validateJoinScope(plan, scope.allowedJoinGraph || []));

    return diagnostics;
}
