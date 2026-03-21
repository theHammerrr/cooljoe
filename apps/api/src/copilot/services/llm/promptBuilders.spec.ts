import { describe, expect, it } from 'vitest';
import { buildChatSystemPrompt, buildDraftSystemPrompt } from './promptBuilders';

describe('promptBuilders', () => {
    it('instructs draft generation to avoid unnecessary joins', () => {
        const prompt = buildDraftSystemPrompt({});

        expect(prompt).toContain('Do not add a relationship or join unless another table is actually required');
        expect(prompt).toContain('If one table can satisfy the request, keep "relationships" empty.');
    });

    it('instructs chat responses to return a single query language', () => {
        const prompt = buildChatSystemPrompt({});

        expect(prompt).toContain('return only one query language');
        expect(prompt).toContain('Do not include both SQL and Prisma in the same answer.');
    });
});
