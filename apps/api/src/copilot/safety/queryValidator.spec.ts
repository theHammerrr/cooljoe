import { describe, it, expect } from 'vitest';
import { Parser } from 'node-sql-parser';
import {
    validateAndFormatQuery,
    DisallowedStatementError,
    DisallowedTableError
} from './queryValidator';

describe('Query Validator', () => {
    const allowlist = ['users', 'orders'];
    const parser = new Parser();

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

    it('adds aliases to FROM/JOIN tables without relying on exact SQL formatting', () => {
        const sql = 'SELECT users.id FROM users JOIN orders ON users.id = orders.user_id';
        const safeSql = validateAndFormatQuery(sql, allowlist, 50);
        const ast = parser.astify(safeSql, { database: 'Postgresql' });
        const firstStatement = Array.isArray(ast) ? ast[0] : ast;
        const fromClause = Reflect.get(firstStatement, 'from');

        expect(Array.isArray(fromClause)).toBe(true);
        if (!Array.isArray(fromClause)) {
            return;
        }

        const aliases = fromClause
            .map((entry) => (typeof entry === 'object' && entry !== null ? Reflect.get(entry, 'as') : null))
            .filter((alias): alias is string => typeof alias === 'string' && alias.length > 0);

        expect(aliases.length).toBe(2);
        expect(new Set(aliases).size).toBe(2);
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
