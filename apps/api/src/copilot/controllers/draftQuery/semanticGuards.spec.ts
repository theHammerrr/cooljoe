import { describe, expect, it } from 'vitest';
import { detectSemanticDraftIssue } from './semanticGuards';

describe('detectSemanticDraftIssue', () => {
    it('flags echoed low-confidence deterministic candidate', () => {
        const issue = detectSemanticDraftIssue(
            'get all employees with their names',
            'SELECT "employee".* FROM "nitzan"."employee"',
            { confidence: 0.45, sql: 'SELECT "employee".* FROM "nitzan"."employee"' }
        );
        expect(issue).toContain('echoed low-confidence deterministic candidate');
    });

    it('flags wildcard employee query when prompt asks for names', () => {
        const issue = detectSemanticDraftIssue(
            'get all employees with their names',
            'SELECT "employee".* FROM "nitzan"."employee"'
        );
        expect(issue).toContain('asks for names');
    });

    it('does not flag when name columns are explicit', () => {
        const issue = detectSemanticDraftIssue(
            'get all employees with their names',
            'SELECT "person"."first_name", "person"."last_name" FROM "nitzan"."employee" JOIN "nitzan"."person" ON "employee"."person_id" = "person"."person_id"'
        );
        expect(issue).toBeNull();
    });
});
