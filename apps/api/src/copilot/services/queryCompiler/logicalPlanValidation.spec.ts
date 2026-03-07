import { describe, expect, it } from 'vitest';
import { validateLogicalPlanSemantics } from './logicalPlanValidation';

describe('validateLogicalPlanSemantics', () => {
    it('rejects ranking intent without order and bounded limit', () => {
        const diagnostics = validateLogicalPlanSemantics({
            intent: 'top customers',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [{ table: 'public.customer', column: 'name' }],
            measures: [{ table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }],
            relationships: [],
            filters: [],
            order: [],
            ranking: { limit: 10, direction: 'desc' },
            limit: 100,
            riskFlags: []
        }, 'sql');

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_ORDER_BY')).toBe(true);
        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_LIMIT')).toBe(true);
    });

    it('rejects time semantics without time dimension/filter', () => {
        const diagnostics = validateLogicalPlanSemantics({
            intent: 'monthly revenue',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [{ table: 'public.customer', column: 'name' }],
            measures: [{ table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }],
            relationships: [],
            filters: [],
            order: [],
            time: { grain: 'month', range: 'last 3 months' },
            limit: 10,
            riskFlags: []
        }, 'sql');

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_TIME_BUCKET')).toBe(true);
        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_TIME_FILTER')).toBe(true);
    });
});
