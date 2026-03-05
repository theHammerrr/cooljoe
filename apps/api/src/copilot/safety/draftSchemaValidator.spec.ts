import { describe, expect, it } from 'vitest';
import { validateDraftSqlAgainstSchemaWithRequirements } from './draftSchemaValidator';

describe('Draft Schema Validator', () => {
    const schema = {
        'nitzan.person': [
            { column: 'person_id' },
            { column: 'first_name' },
            { column: 'last_name' }
        ],
        'nitzan.employee': [
            { column: 'person_id' },
            { column: 'boss_id' },
            { column: 'job_name' }
        ],
        'nitzan.job': [
            { column: 'name' },
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
        expect(result.errors.some((error) => error.includes('Unknown table referenced by column "first_name": b'))).toBe(true);
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
});
