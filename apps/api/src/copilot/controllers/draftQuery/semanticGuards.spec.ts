import { describe, expect, it } from 'vitest';
import { detectSemanticDraftIssue, detectSemanticDraftIssues } from './semanticGuards';

describe('detectSemanticDraftIssue', () => {
    it('flags echoed low-confidence deterministic candidate', () => {
        const issue = detectSemanticDraftIssue(
            'get all employees with their names',
            'SELECT "employee".* FROM "nitzan"."employee"',
            { confidence: 0.45, sql: 'SELECT "employee".* FROM "nitzan"."employee"' }
        );
        expect(issue?.code).toBe('LOW_CONFIDENCE_ECHO');
    });

    it('flags wildcard employee query when prompt asks for names', () => {
        const issue = detectSemanticDraftIssue(
            'get all employees with their names',
            'SELECT "employee".* FROM "nitzan"."employee"'
        );
        expect(issue?.code).toBe('MISSING_NAME_COLUMNS');
    });

    it('does not flag when name columns are explicit', () => {
        const issue = detectSemanticDraftIssue(
            'get all employees with their names',
            'SELECT "person"."first_name", "person"."last_name" FROM "nitzan"."employee" JOIN "nitzan"."person" ON "employee"."person_id" = "person"."person_id"'
        );
        expect(issue).toBeNull();
    });

    it('flags missing aggregation for count intent', () => {
        const issues = detectSemanticDraftIssues(
            'how many employees are active',
            'SELECT e.person_id FROM "nitzan"."employee" e WHERE e.status = \'active\''
        );

        expect(issues.some((issue) => issue.code === 'MISSING_AGGREGATION')).toBe(true);
    });

    it('flags missing ordering and limit for top-n intent', () => {
        const issues = detectSemanticDraftIssues(
            'top 10 customers by revenue',
            'SELECT c.id, c.name FROM "nitzan"."customer" c'
        );

        expect(issues.some((issue) => issue.code === 'MISSING_ORDER_BY')).toBe(true);
        expect(issues.some((issue) => issue.code === 'MISSING_LIMIT')).toBe(true);
    });

    it('flags missing time bucket and filter for time-series intent', () => {
        const issues = detectSemanticDraftIssues(
            'show monthly sales for the last 3 months',
            'SELECT s.amount FROM "nitzan"."sales" s'
        );

        expect(issues.some((issue) => issue.code === 'MISSING_TIME_BUCKET')).toBe(true);
        expect(issues.some((issue) => issue.code === 'MISSING_TIME_FILTER')).toBe(true);
    });
});
