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
});
