import { describe, expect, it } from 'vitest';
import { resolveDeterministicDraft } from './deterministicDraft';

const schema = {
    'nitzan.employee': [
        { column: 'person_id', foreignKeyTarget: 'nitzan.person' },
        { column: 'boss_id', foreignKeyTarget: 'nitzan.employee' },
        { column: 'status' }
    ],
    'nitzan.person': [
        { column: 'id', isPrimary: true },
        { column: 'first_name' },
        { column: 'last_name' }
    ]
};

describe('resolveDeterministicDraft', () => {
    it('returns high confidence for simple single-table retrieval', () => {
        const result = resolveDeterministicDraft('get all employees in nitzan schema', schema, 'nitzan');
        expect(result).not.toBeNull();
        expect(result?.confidence).toBeGreaterThanOrEqual(0.75);
        expect(result?.draft.sql).toContain('LIMIT 50');
        expect(result?.draft.sql).not.toContain('.*');
        expect(result?.draft.expectedColumns.length).toBeGreaterThan(0);
    });

    it('returns lower confidence when name intent is not directly satisfiable from employee table', () => {
        const result = resolveDeterministicDraft('get all employees and their names', schema, 'nitzan');
        expect(result).not.toBeNull();
        expect(result?.confidence).toBeLessThan(0.75);
    });

    it('limits boss deterministic drafts for safety', () => {
        const result = resolveDeterministicDraft('show employees and their bosses', schema, 'nitzan');

        expect(result).not.toBeNull();
        expect(result?.draft.sql).toContain('LIMIT 50');
        expect(result?.draft.prisma).toContain('take: 50');
    });
});
