import { describe, it, expect } from 'vitest';
import { compileSemanticPlan } from './compiler';
import { SemanticQueryPlan } from './types';

describe('Query Compiler', () => {
    it('compiles a simple SELECT query correctly', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Test',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.users', column: 'id' },
                { table: 'public.users', column: 'email', alias: 'user_email' }
            ],
            limit: 50
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain('SELECT "public"."users"."id", "public"."users"."email" AS "user_email"');
        expect(result).toContain('FROM "public"."users"');
        expect(result).toContain('LIMIT 50');
    });

    it('compiles JOINs correctly', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Test',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.users', column: 'id' }
            ],
            joins: [
                { fromTable: 'public.users', fromColumn: 'id', toTable: 'public.orders', toColumn: 'user_id', type: 'left' }
            ],
            limit: 10
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain('LEFT JOIN "public"."orders" ON "public"."users"."id" = "public"."orders"."user_id"');
    });

    it('compiles specific aggregate operations', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Test',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.orders', column: 'amount', agg: 'sum', alias: 'total_revenue' }
            ],
            limit: 1
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain('SELECT SUM("public"."orders"."amount") AS "total_revenue"');
    });

    it('compiles multiple combined filters correctly', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Test',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.orders', column: 'id' }
            ],
            filters: [
                { table: 'public.orders', column: 'status', op: '=', value: 'ACTIVE' },
                { table: 'public.orders', column: 'amount', op: '>', value: 100 },
                { table: 'public.orders', column: 'type', op: 'IN', value: ['SALE', 'REFUND'] }
            ],
            limit: 10
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain(`WHERE "public"."orders"."status" = 'ACTIVE' AND "public"."orders"."amount" > 100 AND "public"."orders"."type" IN ('SALE', 'REFUND')`);
    });
});
