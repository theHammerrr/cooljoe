import { LogicalQueryPlan } from '../queryCompiler/logicalPlanTypes';
import { SemanticQueryPlan } from '../queryCompiler/types';
import { inferRankingSemantics, inferTimeSemantics } from './logicalPlanInference';

export function semanticToLogicalPlan(plan: SemanticQueryPlan): LogicalQueryPlan {
    if (plan.requires_raw_sql) {
        return {
            intent: plan.intent,
            assumptions: plan.assumptions,
            requires_raw_sql: true,
            raw_sql_fallback: plan.raw_sql_fallback,
            relationships: plan.joins,
            filters: plan.filters,
            dimensions: [],
            measures: [],
            order: [],
            time: undefined,
            ranking: undefined,
            limit: plan.limit,
            riskFlags: plan.riskFlags
        };
    }

    return {
        intent: plan.intent,
        assumptions: plan.assumptions,
        requires_raw_sql: false,
        raw_sql_fallback: plan.raw_sql_fallback,
        relationships: plan.joins,
        filters: plan.filters,
        dimensions: [
            ...(plan.groupBy || []).map((dimension) => ({
                table: dimension.table,
                tableRef: dimension.tableRef,
                role: dimension.role,
                column: dimension.column
            })),
            ...plan.select
                .filter((node) => !node.agg && !(plan.groupBy || []).some((dimension) => dimension.table === node.table && dimension.column === node.column))
                .map((node) => ({
                    table: node.table,
                    tableRef: node.tableRef,
                    role: node.role,
                    column: node.column,
                    alias: node.alias
                }))
        ],
        measures: plan.select
            .filter((node) => node.agg)
            .map((node) => ({
                table: node.table,
                tableRef: node.tableRef,
                role: node.role,
                column: node.column,
                agg: node.agg!,
                alias: node.alias
            })),
        order: (plan.orderBy || []).map((entry) => ({
            table: entry.table,
            tableRef: entry.tableRef,
            role: entry.role,
            column: entry.column,
            dir: entry.dir
        })),
        time: inferTimeSemantics(plan),
        ranking: inferRankingSemantics(plan),
        limit: plan.limit,
        riskFlags: plan.riskFlags
    };
}
