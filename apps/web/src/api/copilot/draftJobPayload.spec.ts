import { describe, expect, it } from 'vitest';
import { parseDraftJobPayload } from './draftJobPayload';

describe('parseDraftJobPayload', () => {
    it('parses typed query payloads', () => {
        const payload = parseDraftJobPayload({
            kind: 'query',
            query: {
                intent: 'employee lookup',
                sql: 'select * from employee',
                riskFlags: []
            }
        });

        expect(payload).toEqual({
            kind: 'query',
            query: {
                intent: 'employee lookup',
                sql: 'select * from employee',
                riskFlags: []
            }
        });
    });

    it('maps legacy validation errors into the typed validation payload', () => {
        const payload = parseDraftJobPayload({
            error: 'Generated SQL failed schema validation.',
            issues: ['Unknown join path.'],
            draft: {
                intent: 'employee lookup',
                sql: 'select * from employee',
                riskFlags: []
            }
        }, 422);

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
});
