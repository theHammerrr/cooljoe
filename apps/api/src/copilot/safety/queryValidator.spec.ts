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

    it('normalizes malformed quoted schema.table identifiers', () => {
        const sql = 'SELECT * FROM "public.users"';
        const safeSql = validateAndFormatQuery(sql, allowlist, 50);
        expect(safeSql).toContain('"public"."users"');
        expect(safeSql).toContain('LIMIT 50');
    });

    it('does not force alias rewriting in FROM/JOIN tables', () => {
        const sql = 'SELECT users.id FROM users JOIN orders ON users.id = orders.user_id';
        const safeSql = validateAndFormatQuery(sql, allowlist, 50);
        expect(safeSql.toLowerCase()).toContain('from "users"');
        expect(safeSql.toLowerCase()).toContain('join "orders"');
        expect(safeSql).not.toContain(' AS t1');
        expect(safeSql).not.toContain(' AS t2');
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

    it('can skip allowlist enforcement when requested', () => {
        const sql = 'SELECT * FROM secrets';
        const safeSql = validateAndFormatQuery(sql, allowlist, 25, { enforceAllowlist: false });

        expect(safeSql.toLowerCase()).toContain('from "secrets"');
        expect(safeSql).toContain('LIMIT 25');
    });
});
