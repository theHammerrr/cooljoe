import { describe, expect, it } from 'vitest';
import { buildRankedDraftContext } from './candidateScope';
import { buildIntentSketch } from './intentSketch';

const schema = {
    'public.customer': [
        { column: 'id', isPrimary: true },
        { column: 'name' },
        { column: 'status' }
    ],
    'public.order': [
        { column: 'id', isPrimary: true },
        { column: 'customer_id', foreignKeyTarget: 'public.customer' },
        { column: 'amount' },
        { column: 'created_at' }
    ],
    'public.ticket': [
        { column: 'id', isPrimary: true },
        { column: 'customer_id', foreignKeyTarget: 'public.customer' },
        { column: 'opened_at' }
    ],
    'public.inventory': [
        { column: 'id', isPrimary: true },
        { column: 'sku' }
    ]
};

const joinGraph = [
    { fromTable: 'public.order', fromColumn: 'customer_id', toTable: 'public.customer', toColumn: 'id' },
    { fromTable: 'public.ticket', fromColumn: 'customer_id', toTable: 'public.customer', toColumn: 'id' }
];

const tableCatalog = [
    { table: 'public.customer', columns: ['id', 'name', 'status'], foreignKeys: [] },
    { table: 'public.order', columns: ['id', 'customer_id', 'amount', 'created_at'], foreignKeys: ['customer_id -> public.customer'] },
    { table: 'public.ticket', columns: ['id', 'customer_id', 'opened_at'], foreignKeys: ['customer_id -> public.customer'] },
    { table: 'public.inventory', columns: ['id', 'sku'], foreignKeys: [] }
];

describe('buildRankedDraftContext', () => {
    it('prioritizes entity and measure matches and narrows schema scope', () => {
        const intentSketch = buildIntentSketch('top 10 customers by revenue last month', tableCatalog);
        const ranked = buildRankedDraftContext(schema, joinGraph, tableCatalog, intentSketch);

        expect(ranked).not.toBeNull();
        expect(ranked?.rankedTables[0]?.table).toBe('public.customer');
        expect(ranked?.focusTables).toContain('public.order');
        expect(ranked?.focusTables).not.toContain('public.inventory');
        expect(ranked?.candidateColumnsByTable['public.order']).toContain('amount');
        expect(Object.keys(ranked?.schema || {})).toEqual(expect.arrayContaining(['public.customer', 'public.order']));
        expect(Object.keys(ranked?.schema || {})).not.toContain('public.inventory');
    });

    it('adds time-capable fact tables when the prompt asks for time bucketing', () => {
        const intentSketch = buildIntentSketch('show monthly orders by customer', tableCatalog);
        const ranked = buildRankedDraftContext(schema, joinGraph, tableCatalog, intentSketch);

        expect(ranked).not.toBeNull();
        expect(ranked?.focusTables).toContain('public.order');
        expect(ranked?.rankedTables.find((candidate) => candidate.table === 'public.order')?.reasons).toContain('time column availability');
        expect(ranked?.preferredJoinPaths.some((join) => join.fromTable === 'public.order' && join.toTable === 'public.customer')).toBe(true);
    });
});
