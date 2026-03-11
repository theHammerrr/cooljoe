import { StructuredLogicalQueryPlan } from './logicalPlanTypes';

export function enrichDimensionsWithTime(plan: StructuredLogicalQueryPlan): NonNullable<StructuredLogicalQueryPlan['dimensions']> {
    const dimensions = [...(plan.dimensions || [])];

    if (plan.time?.dimension) {
        const exists = dimensions.some((dimension) =>
            dimension.table === plan.time?.dimension?.table &&
            dimension.column === plan.time?.dimension?.column
        );

        if (!exists) {
            dimensions.unshift({
                ...plan.time.dimension,
                alias: plan.time.dimension.alias || `${plan.time.grain}_${plan.time.dimension.column}`
            });
        }
    }

    return dimensions;
}

export function enrichOrderWithRanking(plan: StructuredLogicalQueryPlan): NonNullable<StructuredLogicalQueryPlan['order']> {
    const order = [...(plan.order || [])];

    if (!plan.ranking) return order;

    const target = plan.ranking.target || plan.measures?.[0] || plan.dimensions?.[0];

    if (!target) return order;

    const exists = order.some((entry) => entry.table === target.table && entry.column === target.column);

    if (!exists) {
        const rankingAgg = getRankingAgg(target, plan);

        order.unshift({
            table: target.table,
            tableRef: target.tableRef,
            role: target.role,
            column: target.column,
            agg: rankingAgg,
            dir: plan.ranking.direction
        });
    }

    return order;
}

function getRankingAgg(
    target: NonNullable<StructuredLogicalQueryPlan['ranking']>['target'] | NonNullable<StructuredLogicalQueryPlan['measures']>[number] | NonNullable<StructuredLogicalQueryPlan['dimensions']>[number],
    plan: StructuredLogicalQueryPlan
) {
    if (typeof target !== 'object' || target === null) return plan.ranking?.agg;

    const agg = Reflect.get(target, 'agg');

    return agg === 'count' || agg === 'sum' || agg === 'avg' || agg === 'min' || agg === 'max'
        ? agg
        : plan.ranking?.agg;
}
