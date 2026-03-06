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

    it('defaults missing assumptions to an empty array', () => {
        const content = JSON.stringify({
            intent: 'Get employees',
            requires_raw_sql: false,
            select: [{ table: 'nitzan.employee', column: 'person_id' }],
            limit: 10
        });

        const plan = parseDraftResponse(content);
        expect(plan.assumptions).toEqual([]);
    });

    it('accepts raw-sql fallback plans without select array', () => {
        const content = JSON.stringify({
            intent: 'Complex query',
            requires_raw_sql: true,
            raw_sql_fallback: 'SELECT 1'
        });

        const plan = parseDraftResponse(content);
        expect(plan.requires_raw_sql).toBe(true);
        expect(plan.raw_sql_fallback).toBe('SELECT 1');
    });

    it('maps legacy sql field to raw_sql_fallback and parses as raw mode', () => {
        const content = JSON.stringify({
            intent: 'Legacy SQL response',
            sql: 'SELECT * FROM "nitzan"."employee"'
        });

        const plan = parseDraftResponse(content);
        expect(plan.requires_raw_sql).toBe(true);
        expect(plan.raw_sql_fallback).toContain('SELECT * FROM');
    });
});
