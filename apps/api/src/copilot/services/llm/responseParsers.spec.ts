import { describe, expect, it } from 'vitest';
import { parseDraftResponse } from './responseParsers';

describe('parseDraftResponse', () => {
    it('normalizes select string shorthand to select objects', () => {
        const content = JSON.stringify({
            intent: 'Get employees',
            assumptions: [],
            requires_raw_sql: false,
            select: ['nitzan.employee.person_id'],
            limit: 10
        });

        const plan = parseDraftResponse(content);
        expect(plan.select[0]).toEqual({
            table: 'nitzan.employee',
            column: 'person_id'
        });
    });
});
