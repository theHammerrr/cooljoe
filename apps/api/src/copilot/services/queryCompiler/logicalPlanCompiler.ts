import { LogicalQueryPlan, StructuredLogicalQueryPlan } from './logicalPlanTypes';
import { SemanticQueryPlan } from './types';
import { enrichDimensionsWithTime, enrichOrderWithRanking } from './logicalPlanCompilerHelpers';
import { enrichDimensionsWithDerivedOperations, enrichMeasuresWithDerivedOperations } from './logicalDerivedCompiler';

export function compileLogicalToSemanticPlan(plan: LogicalQueryPlan): SemanticQueryPlan {
    if (plan.requires_raw_sql) {
        return {
            intent: plan.intent,
            assumptions: plan.assumptions,
            requires_raw_sql: true,
            raw_sql_fallback: plan.raw_sql_fallback,
            select: [],
            joins: [],
            filters: plan.filters || [],
            groupBy: [],
            orderBy: [],
            limit: plan.limit,
            riskFlags: plan.riskFlags
        };
    }

    return compileStructuredLogicalPlan(plan);
}

function compileStructuredLogicalPlan(plan: StructuredLogicalQueryPlan): SemanticQueryPlan {
    const dimensions = enrichDimensionsWithDerivedOperations(enrichDimensionsWithTime(plan), plan);
    const measures = enrichMeasuresWithDerivedOperations(plan.measures || [], plan);
    const order = enrichOrderWithRanking(plan);
    const limit = plan.ranking ? Math.min(plan.limit, plan.ranking.limit) : plan.limit;

    return {
        intent: plan.intent,
        assumptions: plan.assumptions,
        requires_raw_sql: false,
        raw_sql_fallback: plan.raw_sql_fallback,
        select: [
            ...dimensions.map((dimension) => ({
                table: dimension.table,
                tableRef: dimension.tableRef,
                role: dimension.role,
                column: dimension.column,
                timeGrain: getDimensionTimeGrain(plan, dimension.table, dimension.column),
                alias: dimension.alias
            })),
            ...measures.map((measure) => ({
                table: measure.table,
                tableRef: measure.tableRef,
                role: measure.role,
                column: measure.column,
                agg: measure.agg,
                distinct: isDistinctMeasure(plan, measure.table, measure.column),
                alias: measure.alias
            }))
        ],
        joins: plan.relationships || [],
        filters: plan.filters || [],
        groupBy: dimensions.length > 0 ? dimensions.map((dimension) => ({
            table: dimension.table,
            tableRef: dimension.tableRef,
            role: dimension.role,
            column: dimension.column,
            timeGrain: getDimensionTimeGrain(plan, dimension.table, dimension.column)
        })) : [],
        orderBy: order.map((entry) => ({
            table: entry.table,
            tableRef: entry.tableRef,
            role: entry.role,
            column: entry.column,
            timeGrain: getDimensionTimeGrain(plan, entry.table, entry.column),
            dir: entry.dir
        })),
        limit,
        riskFlags: plan.riskFlags
    };
}

function getDimensionTimeGrain(plan: StructuredLogicalQueryPlan, table: string, column: string) {
    const derivedTimeBucket = plan.derived?.find((operation) =>
        operation.kind === 'time_bucket' &&
        operation.source.table === table &&
        operation.source.column === column
    );

    if (derivedTimeBucket?.kind === 'time_bucket') return derivedTimeBucket.grain;

    if (plan.time?.dimension?.table === table && plan.time?.dimension?.column === column) {
        return plan.time.grain;
    }

    return undefined;
}

function isDistinctMeasure(plan: StructuredLogicalQueryPlan, table: string, column: string): boolean {
    return !!plan.derived?.some((operation) =>
        operation.kind === 'distinct_count' &&
        operation.source.table === table &&
        operation.source.column === column
    );
}
