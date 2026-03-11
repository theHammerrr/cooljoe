import { describe, expect, it } from 'vitest';
import { compileLogicalToSemanticPlan } from './logicalPlanCompiler';

describe('compileLogicalToSemanticPlan', () => {
    it('converts a structured logical plan into the semantic plan shape', () => {
        const semanticPlan = compileLogicalToSemanticPlan({
            intent: 'rank customers by revenue',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [{ table: 'public.customer', column: 'name', alias: 'customer_name' }],
            measures: [{ table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }],
            relationships: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id', type: 'inner' }],
            filters: [{ table: 'public.order', column: 'created_at', op: '>=', value: '2026-02-01' }],
            order: [],
            time: { grain: 'month', dimension: { table: 'public.order', column: 'created_at' }, range: 'last month' },
            ranking: { limit: 10, direction: 'desc', target: { table: 'public.order', column: 'amount' }, agg: 'sum' },
            derived: [{ kind: 'time_bucket', source: { table: 'public.order', column: 'created_at' }, grain: 'month', alias: 'month_created_at' }],
            limit: 25,
            riskFlags: ['aggregation']
        });

        expect(semanticPlan.requires_raw_sql).toBe(false);
        expect(semanticPlan.select).toHaveLength(3);
        expect(semanticPlan.groupBy).toEqual([
            { table: 'public.order', tableRef: undefined, role: undefined, column: 'created_at', timeGrain: 'month' },
            { table: 'public.customer', tableRef: undefined, role: undefined, column: 'name' }
        ]);
        expect(semanticPlan.joins?.[0]?.toTable).toBe('public.order');
        expect(semanticPlan.orderBy?.[0]?.column).toBe('amount');
        expect(semanticPlan.limit).toBe(10);
    });

    it('compiles distinct_count derived operations into distinct count measures', () => {
        const semanticPlan = compileLogicalToSemanticPlan({
            intent: 'count distinct customers',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [],
            measures: [],
            relationships: [],
            filters: [],
            order: [],
            derived: [{ kind: 'distinct_count', source: { table: 'public.order', column: 'customer_id' }, alias: 'distinct_customers' }],
            limit: 1,
            riskFlags: []
        });

        expect(semanticPlan.select).toEqual([
            {
                table: 'public.order',
                tableRef: undefined,
                role: undefined,
                column: 'customer_id',
                agg: 'count',
                distinct: true,
                alias: 'distinct_customers'
            }
        ]);
    });

    it('passes raw fallback plans through', () => {
        const semanticPlan = compileLogicalToSemanticPlan({
            intent: 'custom query',
            assumptions: [],
            requires_raw_sql: true,
            raw_sql_fallback: 'SELECT 1',
            relationships: [],
            filters: [],
            dimensions: [],
            measures: [],
            order: [],
            derived: [],
            limit: 1,
            riskFlags: []
        });

        expect(semanticPlan.requires_raw_sql).toBe(true);
        expect(semanticPlan.raw_sql_fallback).toBe('SELECT 1');
    });
});
