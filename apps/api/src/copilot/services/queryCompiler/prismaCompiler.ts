import { StructuredSemanticQueryPlan } from './types';
import {
    buildSelectIncludeTree,
    formatPrismaArgs,
    hasAgg,
    mapOperator,
    mergeFilter,
    stripSchemaName
} from './prismaCompilerHelpers';

function buildAggregationArgs(plan: StructuredSemanticQueryPlan): Record<string, unknown> {
    const args: Record<string, unknown> = {};
    const buckets: Record<'_count' | '_sum' | '_avg' | '_min' | '_max', Record<string, boolean>> = {
        _count: {}, _sum: {}, _avg: {}, _min: {}, _max: {}
    };
    const toBucket = (agg: 'count' | 'sum' | 'avg' | 'min' | 'max'): '_count' | '_sum' | '_avg' | '_min' | '_max' => {
        switch (agg) {
            case 'count': return '_count';
            case 'sum': return '_sum';
            case 'avg': return '_avg';
            case 'min': return '_min';
            case 'max': return '_max';
        }
    };

    for (const node of plan.select) {
        if (!node.agg) continue;

        if (node.agg === 'count' && node.column === '*') args._count = true;
        else buckets[toBucket(node.agg)][node.column] = true;
    }

    for (const [key, value] of Object.entries(buckets)) if (Object.keys(value).length > 0) args[key] = value;

    return args;
}

export function compilePrismaPlan(plan: StructuredSemanticQueryPlan): string {
    assertPrismaCompatiblePlan(plan);
    const baseTable = plan.joins?.[0]?.fromTable || plan.select[0].table;
    const modelName = stripSchemaName(baseTable);
    const args: Record<string, unknown> = {};

    if (plan.filters?.length) {
        const where: Record<string, unknown> = {};

        for (const filter of plan.filters) {
            const table = stripSchemaName(filter.table);

            if (table === modelName) where[filter.column] = mergeFilter(where[filter.column], filter);
            else where[table] = { is: { [filter.column]: mapOperator(filter.op, filter.value) } };
        }
        args.where = where;
    }

    const isAggregation = plan.select.some(hasAgg);
    const call = isAggregation ? 'groupBy' : 'findMany';

    if (isAggregation) {
        if (plan.groupBy?.length) {
            args.by = plan.groupBy
                .filter((g) => g.table === baseTable || stripSchemaName(g.table) === modelName)
                .map((g) => g.column);
        }
        Object.assign(args, buildAggregationArgs(plan));
    } else {
        const tree = buildSelectIncludeTree(modelName, plan.joins || [], plan.select);

        if (tree !== true) {
            if ('select' in tree) args.select = tree.select;

            if ('include' in tree) args.include = tree.include;
        }
    }

    if (plan.orderBy?.length) {
        args.orderBy = plan.orderBy.map((order) => {
            const table = stripSchemaName(order.table);

            return table === modelName ? { [order.column]: order.dir } : { [table]: { [order.column]: order.dir } };
        });
    }

    if (plan.limit && plan.limit < 1000) args.take = plan.limit;

    return `prisma.${modelName}.${call}(${formatPrismaArgs(args)})`;
}

function assertPrismaCompatiblePlan(plan: StructuredSemanticQueryPlan): void {
    const hasUnsupportedSelect = plan.select.some((node) => node.distinct || node.timeGrain);
    const hasUnsupportedGroupBy = (plan.groupBy || []).some((node) => node.timeGrain);
    const hasUnsupportedOrderBy = (plan.orderBy || []).some((node) => node.timeGrain);

    if (hasUnsupportedSelect || hasUnsupportedGroupBy || hasUnsupportedOrderBy) {
        throw new Error('Prisma compiler does not support time-bucket or distinct derived operations.');
    }
}
