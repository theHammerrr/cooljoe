import { describe, expect, it } from 'vitest';
import { canonicalizeSemanticPlanIdentifiers } from './identifierCanonicalization';
import { SemanticQueryPlan } from './types';

describe('identifierCanonicalization', () => {
    it('maps mixed-case table and column identifiers back to the schema casing', () => {
        const schema = {
            'public.PEOPLE': [
                { column: 'ID', isPrimary: true },
                { column: 'firstName' },
                { column: 'last_name' }
            ],
            'public.Orders': [
                { column: 'orderId', isPrimary: true },
                { column: 'personID', foreignKeyTarget: 'public.PEOPLE' },
                { column: 'createdAt' }
            ]
        };

        const plan: SemanticQueryPlan = {
            intent: 'people orders',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.people', column: 'firstname' },
                { table: 'orders', column: 'createdat' }
            ],
            joins: [
                { fromTable: 'public.people', fromColumn: 'id', toTable: 'orders', toColumn: 'personid', type: 'left' }
            ],
            limit: 10
        };

        const canonicalPlan = canonicalizeSemanticPlanIdentifiers(plan, schema);

        expect(canonicalPlan.requires_raw_sql).toBe(false);

        if (canonicalPlan.requires_raw_sql) {
            throw new Error('Expected structured semantic plan');
        }

        expect(canonicalPlan.select).toEqual([
            { table: 'public.PEOPLE', column: 'firstName' },
            { table: 'public.Orders', column: 'createdAt' }
        ]);
        expect(canonicalPlan.joins).toEqual([
            { fromTable: 'public.PEOPLE', fromColumn: 'ID', toTable: 'public.Orders', toColumn: 'personID', type: 'left' }
        ]);
    });
});
