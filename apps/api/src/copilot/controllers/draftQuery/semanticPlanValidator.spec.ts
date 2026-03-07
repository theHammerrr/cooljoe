import { describe, expect, it } from 'vitest';
import { buildIntentSketch } from './intentSketch';
import { validateSemanticPlanAgainstIntent } from './semanticPlanValidator';

const tableCatalog = [
    { table: 'public.customer', columns: ['id', 'name', 'status'], foreignKeys: [] },
    { table: 'public.order', columns: ['id', 'customer_id', 'amount', 'created_at'], foreignKeys: ['customer_id -> public.customer'] }
];

describe('validateSemanticPlanAgainstIntent', () => {
    it('rejects plans that go outside the candidate table scope', () => {
        const intentSketch = buildIntentSketch('top 10 customers by revenue', tableCatalog);
        const diagnostics = validateSemanticPlanAgainstIntent({
            intent: 'rank customers',
            assumptions: [],
            requires_raw_sql: false,
            select: [{ table: 'public.payment', column: 'amount', agg: 'sum', alias: 'revenue' }],
            joins: [],
            filters: [],
            groupBy: [{ table: 'public.customer', column: 'name' }],
            orderBy: [{ table: 'public.payment', column: 'amount', dir: 'desc' }],
            limit: 10
        }, intentSketch, {
            candidateTables: ['public.customer', 'public.order']
        });

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'PLAN_OUTSIDE_CANDIDATE_SCOPE')).toBe(true);
    });

    it('rejects ranked plans that omit order and limit', () => {
        const intentSketch = buildIntentSketch('top 10 customers by revenue', tableCatalog);
        const diagnostics = validateSemanticPlanAgainstIntent({
            intent: 'customer revenue',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.customer', column: 'name' },
                { table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }
            ],
            joins: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id', type: 'inner' }],
            filters: [],
            groupBy: [{ table: 'public.customer', column: 'name' }],
            limit: 101
        }, intentSketch, {
            candidateTables: ['public.customer', 'public.order']
        });

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_ORDER_BY')).toBe(true);
        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_LIMIT')).toBe(true);
    });

    it('rejects time-series plans that do not group or filter on time', () => {
        const intentSketch = buildIntentSketch('show monthly revenue for the last 3 months by customer', tableCatalog);
        const diagnostics = validateSemanticPlanAgainstIntent({
            intent: 'monthly customer revenue',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.customer', column: 'name' },
                { table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }
            ],
            joins: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id', type: 'inner' }],
            filters: [],
            groupBy: [{ table: 'public.customer', column: 'name' }],
            orderBy: [{ table: 'public.order', column: 'amount', dir: 'desc' }],
            limit: 10
        }, intentSketch, {
            candidateTables: ['public.customer', 'public.order']
        });

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_TIME_BUCKET')).toBe(true);
        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_TIME_FILTER')).toBe(true);
    });

    it('accepts a plan that satisfies entity, ranking, and time intent', () => {
        const intentSketch = buildIntentSketch('top 10 customers by revenue last month', tableCatalog);
        const diagnostics = validateSemanticPlanAgainstIntent({
            intent: 'rank customers by last-month revenue',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.customer', column: 'name' },
                { table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }
            ],
            joins: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id', type: 'inner' }],
            filters: [{ table: 'public.order', column: 'created_at', op: '>=', value: '2026-02-01' }],
            groupBy: [{ table: 'public.customer', column: 'name' }],
            orderBy: [{ table: 'public.order', column: 'amount', dir: 'desc' }],
            limit: 10
        }, intentSketch, {
            candidateTables: ['public.customer', 'public.order']
        });

        expect(diagnostics).toEqual([]);
    });

    it('rejects columns and joins outside narrowed scope', () => {
        const intentSketch = buildIntentSketch('top 10 customers by revenue', tableCatalog);
        const diagnostics = validateSemanticPlanAgainstIntent({
            intent: 'rank customers by revenue',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.customer', column: 'email' },
                { table: 'public.order', column: 'amount', agg: 'sum', alias: 'revenue' }
            ],
            joins: [{ fromTable: 'public.customer', fromColumn: 'status', toTable: 'public.order', toColumn: 'amount', type: 'inner' }],
            filters: [],
            groupBy: [{ table: 'public.customer', column: 'email' }],
            orderBy: [{ table: 'public.order', column: 'amount', dir: 'desc' }],
            limit: 10
        }, intentSketch, {
            candidateTables: ['public.customer', 'public.order'],
            candidateColumnsByTable: {
                'public.customer': ['id', 'name'],
                'public.order': ['amount', 'created_at', 'customer_id']
            },
            allowedJoinGraph: [{ fromTable: 'public.customer', fromColumn: 'id', toTable: 'public.order', toColumn: 'customer_id' }]
        });

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'PLAN_OUTSIDE_COLUMN_SCOPE')).toBe(true);
        expect(diagnostics.some((diagnostic) => diagnostic.code === 'PLAN_INVALID_JOIN_PATH')).toBe(true);
    });
});
