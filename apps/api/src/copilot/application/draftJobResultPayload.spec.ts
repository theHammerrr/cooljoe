import { describe, expect, it } from 'vitest';
import {
    buildQueryDraftResultPayload,
    buildRuntimeErrorDraftResultPayload,
    buildValidationErrorDraftResultPayload
} from './draftJobResultPayload';

describe('draftJobResultPayload', () => {
    it('wraps successful drafts in a typed query payload', () => {
        const payload = buildQueryDraftResultPayload('draft_1', {
            intent: 'employee lookup',
            requires_raw_sql: false,
            select: [{ table: 'nitzan.employee', column: 'name' }],
            joins: [],
            filters: [],
            orderBy: [],
            limit: 100,
            assumptions: [],
            riskFlags: []
        }, 'select * from employee');

        expect(payload.kind).toBe('query');
        expect(payload.query.sql).toBe('select * from employee');
    });

    it('preserves failed validation drafts with typed metadata', () => {
        const payload = buildValidationErrorDraftResultPayload({
            error: 'Generated SQL failed schema validation.',
            issues: ['Unknown join path.'],
            diagnostics: [],
            draft: {
                intent: 'employee lookup',
                sql: 'select * from employee',
                riskFlags: []
            }
        });

        expect(payload).toEqual({
            kind: 'validation_error',
            error: 'Generated SQL failed schema validation.',
            issues: ['Unknown join path.'],
            diagnostics: [],
            draft: {
                intent: 'employee lookup',
                sql: 'select * from employee',
                riskFlags: []
            }
        });
    });

    it('wraps runtime failures in a typed error payload', () => {
        expect(buildRuntimeErrorDraftResultPayload('Queue full.')).toEqual({
            kind: 'runtime_error',
            error: 'Queue full.'
        });
    });
});
