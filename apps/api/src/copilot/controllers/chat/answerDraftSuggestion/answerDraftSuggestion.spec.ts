import { describe, expect, it } from 'vitest';
import { resolveSuggestedDraftFromAnswer } from './answerDraftSuggestion';

describe('resolveSuggestedDraftFromAnswer', () => {
    it('extracts SQL-shaped answers into a suggested draft', () => {
        const suggestedDraft = resolveSuggestedDraftFromAnswer(
            'show active users',
            'Use this query:\n```sql\nselect id, name from public.user where active = true\n```'
        );

        expect(suggestedDraft).toMatchObject({
            mode: 'sql',
            question: 'show active users',
            ctaLabel: 'Create Draft From Answer'
        });
        expect(suggestedDraft?.constraints).toContain('select id, name from public.user');
    });

    it('prefers SQL when both SQL and Prisma queries appear in the same answer', () => {
        const suggestedDraft = resolveSuggestedDraftFromAnswer(
            'show active users',
            [
                'SQL:',
                '```sql',
                'select id, "firstName" from public.users',
                '```',
                'Prisma:',
                '```ts',
                'prisma.users.findMany({ select: { id: true, firstName: true } })',
                '```'
            ].join('\n')
        );

        expect(suggestedDraft?.mode).toBe('sql');
        expect(suggestedDraft?.constraints).toContain('Candidate SQL');
        expect(suggestedDraft?.constraints).not.toContain('prisma.users.findMany');
    });

    it('returns null when the answer is not query-shaped', () => {
        expect(resolveSuggestedDraftFromAnswer('show active users', 'I need one more detail before I can help.')).toBeNull();
    });
});
