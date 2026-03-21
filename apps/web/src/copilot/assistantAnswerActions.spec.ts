import { describe, expect, it } from 'vitest';
import { buildAssistantAnswerActions } from './assistantAnswerActions';

describe('buildAssistantAnswerActions', () => {
    it('extracts SQL injection and draft actions from a SQL answer', () => {
        const actions = buildAssistantAnswerActions(
            'show users',
            '```sql\nselect id, "firstName" from public.users\n```'
        );

        expect(actions.suggestedInjection?.mode).toBe('sql');
        expect(actions.suggestedInjection?.sql).toContain('select id, "firstName" from public.users');
        expect(actions.suggestedDraft?.mode).toBe('sql');
    });

    it('prefers SQL when the assistant answer includes both SQL and Prisma', () => {
        const actions = buildAssistantAnswerActions(
            'show users',
            [
                '```sql',
                'select id, "firstName" from public.users',
                '```',
                '```ts',
                'prisma.users.findMany({ select: { id: true, firstName: true } })',
                '```'
            ].join('\n')
        );

        expect(actions.suggestedInjection?.mode).toBe('sql');
        expect(actions.suggestedInjection?.sql).toContain('select id, "firstName" from public.users');
        expect(actions.suggestedInjection?.prisma).toBeUndefined();
        expect(actions.suggestedDraft?.constraints).not.toContain('prisma.users.findMany');
    });

    it('falls back to Prisma when SQL is not present', () => {
        const actions = buildAssistantAnswerActions(
            'show users',
            '```ts\nprisma.users.findMany({ select: { id: true } })\n```'
        );

        expect(actions.suggestedInjection?.mode).toBe('prisma');
        expect(actions.suggestedInjection?.prisma).toContain('prisma.users.findMany');
        expect(actions.suggestedDraft?.mode).toBe('prisma');
    });
});
