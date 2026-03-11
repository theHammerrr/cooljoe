import { LogicalQueryPlan } from './logicalPlanTypes';
import { DraftDiagnostic } from '../../controllers/draftQuery/diagnostics';
import { DraftTargetMode } from '../../controllers/draftQuery/buildDraftContext';
import { validateDerivedOperations } from './logicalDerivedValidation';

export function validateLogicalPlanSemantics(plan: LogicalQueryPlan, preferredMode: DraftTargetMode): DraftDiagnostic[] {
    if (plan.requires_raw_sql) return [];

    const diagnostics: DraftDiagnostic[] = validateDerivedOperations(plan, preferredMode);

    if (plan.ranking) {
        if (!plan.order?.length) {
            diagnostics.push({
                code: 'MISSING_ORDER_BY',
                message: 'Logical plan declares ranking intent but does not include any order clause.'
            });
        }

        if (!plan.limit || plan.limit > plan.ranking.limit) {
            diagnostics.push({
                code: 'MISSING_LIMIT',
                message: `Logical plan ranking intent requires limit ${plan.ranking.limit}, but the plan limit is ${plan.limit ?? 'missing'}.`
            });
        }
    }

    if (plan.time) {
        const timeDimension = (plan.dimensions || []).find((dimension) => isTimeColumn(dimension.column));
        const timeFilter = (plan.filters || []).find((filter) => isTimeColumn(filter.column));

        if (!timeDimension) {
            diagnostics.push({
                code: 'MISSING_TIME_BUCKET',
                message: `Logical plan declares time grain "${plan.time.grain}" but does not include a time dimension.`
            });
        }

        if (plan.time.range && !timeFilter) {
            diagnostics.push({
                code: 'MISSING_TIME_FILTER',
                message: `Logical plan declares time range "${plan.time.range}" but does not include a time filter.`
            });
        }
    }

    return diagnostics;
}

function isTimeColumn(column: string): boolean {
    return /\b(date|time|created_at|updated_at|timestamp)\b/i.test(column);
}
