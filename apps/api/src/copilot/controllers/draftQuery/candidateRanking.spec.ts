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

    it('preserves explicitly requested descriptive columns in candidate scope', () => {
        const descriptionSchema = {
            ...schema,
            'public.employee': [
                { column: 'id', isPrimary: true },
                { column: 'name' },
                { column: 'job_id', foreignKeyTarget: 'public.job' }
            ],
            'public.job': [
                { column: 'id', isPrimary: true },
                { column: 'name' },
                { column: 'description' }
            ]
        };
        const descriptionJoinGraph = [
            ...joinGraph,
            { fromTable: 'public.employee', fromColumn: 'job_id', toTable: 'public.job', toColumn: 'id' }
        ];
        const descriptionCatalog = [
            ...tableCatalog,
            { table: 'public.employee', columns: ['id', 'name', 'job_id'], foreignKeys: ['job_id -> public.job'] },
            { table: 'public.job', columns: ['id', 'name', 'description'], foreignKeys: [] }
        ];
        const intentSketch = buildIntentSketch("get all employees name's and the job's name and job's description", descriptionCatalog);
        const ranked = buildRankedDraftContext(descriptionSchema, descriptionJoinGraph, descriptionCatalog, intentSketch);

        expect(ranked?.candidateColumnsByTable['public.job']).toContain('description');
    });

    it('expands semantic name requests into first and last name columns', () => {
        const employeeSchema = {
            ...schema,
            'public.employee': [
                { column: 'id', isPrimary: true },
                { column: 'person_id', foreignKeyTarget: 'public.person' }
            ],
            'public.person': [
                { column: 'id', isPrimary: true },
                { column: 'first_name' },
                { column: 'last_name' },
                { column: 'email' }
            ]
        };
        const employeeJoinGraph = [
            ...joinGraph,
            { fromTable: 'public.employee', fromColumn: 'person_id', toTable: 'public.person', toColumn: 'id' }
        ];
        const employeeCatalog = [
            ...tableCatalog,
            { table: 'public.employee', columns: ['id', 'person_id'], foreignKeys: ['person_id -> public.person'] },
            { table: 'public.person', columns: ['id', 'first_name', 'last_name', 'email'], foreignKeys: [] }
        ];
        const intentSketch = buildIntentSketch("get all employee's names", employeeCatalog);
        const ranked = buildRankedDraftContext(employeeSchema, employeeJoinGraph, employeeCatalog, intentSketch);

        expect(intentSketch.mentionedColumns).toEqual(expect.arrayContaining(['first_name', 'last_name']));
        expect(ranked?.candidateColumnsByTable['public.person']).toEqual(expect.arrayContaining(['first_name', 'last_name']));
    });
});
