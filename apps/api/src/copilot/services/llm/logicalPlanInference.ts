import { LogicalRankingSemantics, LogicalTimeSemantics } from '../queryCompiler/logicalPlanTypes';
import { SemanticQueryPlan } from '../queryCompiler/types';

export function inferTimeSemantics(plan: SemanticQueryPlan): LogicalTimeSemantics | undefined {
    const timeDimension = (plan.groupBy || []).find((dimension) => isTimeColumn(dimension.column));
    const timeFilter = (plan.filters || []).find((filter) => isTimeColumn(filter.column));

    if (!timeDimension && !timeFilter) return undefined;

    return {
        grain: inferTimeGrain(timeDimension?.column),
        dimension: timeDimension ? {
            table: timeDimension.table,
            tableRef: timeDimension.tableRef,
            role: timeDimension.role,
            column: timeDimension.column
        } : undefined,
        range: timeFilter ? 'inferred_time_filter' : undefined
    };
}

export function inferRankingSemantics(plan: SemanticQueryPlan): LogicalRankingSemantics | undefined {
    const firstOrder = plan.orderBy?.[0];

    if (!firstOrder || plan.limit === undefined) return undefined;

    return {
        limit: plan.limit,
        direction: firstOrder.dir,
        target: {
            table: firstOrder.table,
            tableRef: firstOrder.tableRef,
            role: firstOrder.role,
            column: firstOrder.column
        }
    };
}

function inferTimeGrain(column?: string): LogicalTimeSemantics['grain'] {
    if (!column) return 'month';

    if (/\bday\b/i.test(column)) return 'day';

    if (/\bweek\b/i.test(column)) return 'week';

    if (/\byear\b/i.test(column)) return 'year';

    return 'month';
}

function isTimeColumn(column: string): boolean {
    return /\b(date|time|created_at|updated_at|timestamp)\b/i.test(column);
}
