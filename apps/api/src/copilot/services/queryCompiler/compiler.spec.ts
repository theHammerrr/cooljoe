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

    it('compiles time_bucket expressions with DATE_TRUNC', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Monthly orders',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.orders', column: 'created_at', timeGrain: 'month', alias: 'month_created_at' },
                { table: 'public.orders', column: 'amount', agg: 'sum', alias: 'total_revenue' }
            ],
            groupBy: [
                { table: 'public.orders', column: 'created_at', timeGrain: 'month' }
            ],
            orderBy: [
                { table: 'public.orders', column: 'created_at', timeGrain: 'month', dir: 'asc' }
            ],
            limit: 12
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain(`DATE_TRUNC('month', "public"."orders"."created_at") AS "month_created_at"`);
        expect(result).toContain(`GROUP BY DATE_TRUNC('month', "public"."orders"."created_at")`);
        expect(result).toContain(`ORDER BY DATE_TRUNC('month', "public"."orders"."created_at") ASC`);
    });

    it('compiles distinct_count aggregates', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Distinct customers',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'public.orders', column: 'customer_id', agg: 'count', distinct: true, alias: 'distinct_customers' }
            ],
            limit: 1
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain('COUNT(DISTINCT "public"."orders"."customer_id") AS "distinct_customers"');
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

    it('rejects plans that reference tables outside FROM/JOIN scope', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Invalid join scope',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'nitzan.employee', column: 'person_id' },
                { table: 'nitzan.person', column: 'first_name' }
            ],
            limit: 10
        };

        expect(() => compileSemanticPlan(plan)).toThrowError('without a FROM/JOIN path');
    });

    it('compiles self joins with generated aliases', () => {
        const plan: SemanticQueryPlan = {
            intent: 'Employee and boss pairs',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'nitzan.employee', tableRef: 'employee_1', column: 'person_id' },
                { table: 'nitzan.employee', tableRef: 'employee_2', column: 'boss_id', alias: 'boss_id' }
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

        const result = compileSemanticPlan(plan);
        expect(result).toContain('FROM "nitzan"."employee" AS "employee_1"');
        expect(result).toContain('LEFT JOIN "nitzan"."employee" AS "employee_2"');
        expect(result).toContain('"employee_1"."boss_id" = "employee_2"."person_id"');
    });

    it('uses alias hint for boss columns when table is repeated', () => {
        const plan: SemanticQueryPlan = {
            intent: 'boss names',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'nitzan.person', column: 'first_name', alias: 'person_first_name' },
                { table: 'nitzan.person', column: 'first_name', alias: 'boss_first_name' }
            ],
            joins: [
                { fromTable: 'nitzan.employee', fromColumn: 'person_id', toTable: 'nitzan.person', toColumn: 'person_id', type: 'left' },
                { fromTable: 'nitzan.employee', fromColumn: 'boss_id', toTable: 'nitzan.person', toColumn: 'person_id', type: 'left' }
            ],
            limit: 10
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain('"person_1"."first_name" AS "person_first_name"');
        expect(result).toContain('"person_2"."first_name" AS "boss_first_name"');
    });

    it('prefers explicit role hint over alias heuristics when repeated', () => {
        const plan: SemanticQueryPlan = {
            intent: 'boss role select',
            assumptions: [],
            requires_raw_sql: false,
            select: [
                { table: 'nitzan.person', role: 'boss', column: 'first_name', alias: 'name_value' }
            ],
            joins: [
                { fromTable: 'nitzan.employee', fromColumn: 'person_id', toTable: 'nitzan.person', toColumn: 'person_id', type: 'left' },
                { fromTable: 'nitzan.employee', fromColumn: 'boss_id', toTable: 'nitzan.person', toColumn: 'person_id', type: 'left' }
            ],
            limit: 10
        };

        const result = compileSemanticPlan(plan);
        expect(result).toContain('"person_2"."first_name" AS "name_value"');
    });
});
