import { describe, expect, it } from 'vitest';
import { validateDerivedOperations } from './logicalDerivedValidation';

describe('validateDerivedOperations', () => {
    it('rejects derived operations for prisma mode', () => {
        const diagnostics = validateDerivedOperations({
            intent: 'monthly revenue',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [],
            measures: [],
            relationships: [],
            filters: [],
            order: [],
            time: { grain: 'month', dimension: { table: 'public.order', column: 'created_at' } },
            derived: [{ kind: 'time_bucket', source: { table: 'public.order', column: 'created_at' }, grain: 'month' }],
            limit: 10,
            riskFlags: []
        }, 'prisma');

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'UNSUPPORTED_DERIVED_OPERATION')).toBe(true);
    });

    it('rejects mismatched time-bucket metadata', () => {
        const diagnostics = validateDerivedOperations({
            intent: 'monthly revenue',
            assumptions: [],
            requires_raw_sql: false,
            dimensions: [],
            measures: [],
            relationships: [],
            filters: [],
            order: [],
            time: { grain: 'week', dimension: { table: 'public.order', column: 'created_at' } },
            derived: [{ kind: 'time_bucket', source: { table: 'public.order', column: 'created_at' }, grain: 'month' }],
            limit: 10,
            riskFlags: []
        }, 'sql');

        expect(diagnostics.some((diagnostic) => diagnostic.code === 'MISSING_TIME_BUCKET')).toBe(true);
    });
});
