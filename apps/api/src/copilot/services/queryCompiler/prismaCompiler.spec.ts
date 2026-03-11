import { describe, expect, it } from 'vitest';
import { compilePrismaPlan } from './prismaCompiler';
import { StructuredSemanticQueryPlan } from './types';

describe('Prisma Compiler', () => {
    it('does not recurse infinitely on cyclic join graphs', () => {
        const plan: StructuredSemanticQueryPlan = {
            intent: 'cyclic join',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'nitzan.employee', column: 'person_id' }
            ],
            joins: [
                {
                    fromTable: 'nitzan.employee',
                    fromColumn: 'boss_id',
                    toTable: 'nitzan.employee',
                    toColumn: 'person_id',
                    type: 'left'
                }
            ],
            limit: 10
        };

        expect(() => compilePrismaPlan(plan)).not.toThrow();
    });

    it('rejects time-bucket and distinct derived operations', () => {
        const plan: StructuredSemanticQueryPlan = {
            intent: 'derived operation',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.orders', column: 'created_at', timeGrain: 'month', alias: 'month_created_at' },
                { table: 'public.orders', column: 'customer_id', agg: 'count', distinct: true, alias: 'distinct_customers' }
            ],
            groupBy: [
                { table: 'public.orders', column: 'created_at', timeGrain: 'month' }
            ],
            limit: 10
        };

        expect(() => compilePrismaPlan(plan)).toThrowError('Prisma compiler does not support time-bucket or distinct derived operations.');
    });
});
