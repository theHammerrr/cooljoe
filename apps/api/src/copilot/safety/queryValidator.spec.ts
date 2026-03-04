import { describe, it, expect } from 'vitest';
import {
    validateAndFormatQuery,
    DisallowedStatementError,
    DisallowedTableError
} from './queryValidator';

describe('Query Validator', () => {
    const allowlist = ['users', 'orders'];

    it('allows safe SELECT queries and injects limit if missing', () => {
        const sql = 'SELECT id, name FROM users';
        const safeSql = validateAndFormatQuery(sql, allowlist, 50);
        expect(safeSql).toContain('LIMIT 50');
        expect(safeSql.toUpperCase()).toContain('SELECT');
    });

    it('caps existing limits', () => {
        const sql = 'SELECT id FROM users LIMIT 1000';
        const safeSql = validateAndFormatQuery(sql, allowlist, 50);
        expect(safeSql).toContain('LIMIT 50');
    });

    it('rejects non-SELECT queries', () => {
        const sql = 'DELETE FROM users';
        expect(() => validateAndFormatQuery(sql, allowlist)).toThrowError(DisallowedStatementError);
    });

    it('rejects tables not in the allowlist', () => {
        const sql = 'SELECT * FROM secrets';
        expect(() => validateAndFormatQuery(sql, allowlist)).toThrowError(DisallowedTableError);
    });
});
