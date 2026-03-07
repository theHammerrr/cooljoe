import { describe, expect, it } from 'vitest';
import { parseDraftResponse } from './responseParsers';

describe('parseDraftResponse', () => {
    it('parses the new logical plan shape', () => {
        const plan = parseDraftResponse(JSON.stringify({
            intent: 'rank customers by revenue',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [{ table: 'public.customer', column: 'name' }],
            measures: [{ table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }],
            relationships: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id', type: 'inner' }],
            filters: [],
            order: [{ table: 'public.order', column: 'amount', agg: 'sum', dir: 'desc' }],
            limit: 10,
            riskFlags: []
        }));

        expect(plan.requires_raw_sql).toBe(false);
        expect(plan.measures?.[0]?.agg).toBe('sum');
    });

    it('maps the legacy semantic shape into the logical plan shape', () => {
        const plan = parseDraftResponse(JSON.stringify({
            intent: 'count employees',
            assumptions: [],
            requires_raw_sql: false,
            select: [{ table: 'public.employee', column: 'id', agg: 'count', alias: 'employee_count' }],
            joins: [],
            filters: [],
            groupBy: [],
            orderBy: [],
            limit: 10,
            riskFlags: []
        }));

        expect(plan.requires_raw_sql).toBe(false);
        expect(plan.measures?.[0]?.agg).toBe('count');
    });

    it('drops malformed optional logical fields instead of throwing', () => {
        const plan = parseDraftResponse(JSON.stringify({
            intent: 'monthly revenue',
            assumptions: [],
            requires_raw_sql: true,
            raw_sql_fallback: '',
            dimensions: [{ table: 'public.customer', column: 'name' }],
            measures: [{ table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }],
            relationships: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id', type: 'inner' }],
            filters: [],
            order: [],
            time: { grain: 'quarter' },
            ranking: { direction: 'desc' },
            derived: [{ kind: 'time_bucket', source: { table: 'public.order' }, grain: 'quarter' }],
            limit: 10,
            riskFlags: []
        }));

        expect(plan.requires_raw_sql).toBe(false);
        expect(plan.time).toBeUndefined();
        expect(plan.ranking).toBeUndefined();
        expect(plan.derived).toBeUndefined();
    });

    it('drops a null limit instead of failing the whole response parse', () => {
        const plan = parseDraftResponse(JSON.stringify({
            intent: 'list customers',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [{ table: 'public.customer', column: 'name' }],
            measures: [],
            relationships: [],
            filters: [],
            order: [],
            limit: null,
            riskFlags: []
        }));

        expect(plan.requires_raw_sql).toBe(false);
        expect(plan.limit).toBe(100);
    });
});
