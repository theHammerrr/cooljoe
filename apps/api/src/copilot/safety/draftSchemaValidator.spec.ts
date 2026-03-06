import { describe, expect, it } from 'vitest';
import { validateDraftSqlAgainstSchemaWithRequirements } from './draftSchemaValidator';

describe('Draft Schema Validator', () => {
    const schema = {
        'nitzan.person': [
            { column: 'person_id', isPrimary: true },
            { column: 'first_name' },
            { column: 'last_name' }
        ],
        'nitzan.employee': [
            { column: 'person_id', foreignKeyTarget: 'nitzan.person' },
            { column: 'boss_id', foreignKeyTarget: 'nitzan.employee' },
            { column: 'job_name' }
        ],
        'nitzan.job': [
            { column: 'name', isPrimary: true },
            { column: 'description' }
        ]
    };

    it('rejects unknown aliases referenced in SELECT list', () => {
        const sql = `
            SELECT e.first_name AS employee_name, b.first_name AS boss_name
            FROM nitzan.person e
            JOIN nitzan.employee emp ON e.person_id = emp.person_id
            JOIN nitzan.employee boss ON emp.boss_id = boss.person_id
        `;

        const result = validateDraftSqlAgainstSchemaWithRequirements(sql, schema, 'nitzan');
        expect(result.valid).toBe(false);
        expect(result.errors.some((error) => error.includes('not present in FROM/JOIN'))).toBe(true);
    });

    it('accepts query when alias is properly joined', () => {
        const sql = `
            SELECT e.first_name AS employee_name, b.first_name AS boss_name
            FROM nitzan.person e
            JOIN nitzan.employee emp ON e.person_id = emp.person_id
            JOIN nitzan.employee boss ON emp.boss_id = boss.person_id
            JOIN nitzan.person b ON boss.person_id = b.person_id
        `;

        const result = validateDraftSqlAgainstSchemaWithRequirements(sql, schema, 'nitzan');
        expect(result.valid).toBe(true);
    });

    it('rejects table-qualified columns when table is not joined', () => {
        const sql = `
            SELECT "nitzan"."employee"."person_id", "nitzan"."person"."first_name"
            FROM "nitzan"."employee"
        `;
        const result = validateDraftSqlAgainstSchemaWithRequirements(sql, schema, 'nitzan');
        expect(result.valid).toBe(false);
        expect(result.errors.some((error) => error.includes('not present in FROM/JOIN'))).toBe(true);
    });

    it('rejects semantically wrong self-join relation for boss person mapping', () => {
        const sql = `
            SELECT p1.first_name AS person_first_name, p2.first_name AS boss_first_name
            FROM nitzan.employee e
            LEFT JOIN nitzan.person p1 ON e.person_id = p1.person_id
            LEFT JOIN nitzan.employee e2 ON e.boss_id = e2.person_id
            LEFT JOIN nitzan.person p2 ON e2.boss_id = p2.person_id
        `;
        const result = validateDraftSqlAgainstSchemaWithRequirements(sql, schema, 'nitzan');
        expect(result.valid).toBe(false);
        expect(result.errors.some((error) => error.includes('Invalid join relation'))).toBe(true);
    });

    it('accepts correct boss person join relation', () => {
        const sql = `
            SELECT p1.first_name AS person_first_name, p2.first_name AS boss_first_name
            FROM nitzan.employee e
            LEFT JOIN nitzan.person p1 ON e.person_id = p1.person_id
            LEFT JOIN nitzan.employee e2 ON e.boss_id = e2.person_id
            LEFT JOIN nitzan.person p2 ON e2.person_id = p2.person_id
        `;
        const result = validateDraftSqlAgainstSchemaWithRequirements(sql, schema, 'nitzan');
        expect(result.valid).toBe(true);
    });
});
