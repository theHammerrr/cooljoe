import { describe, expect, it } from 'vitest';
import { buildSchemaKnowledgeEntries } from './knowledgeMetadata';
import { rerankKnowledgeDocs } from './knowledgeRetrieval';

describe('knowledgeMetadata', () => {
    it('builds column knowledge entries from comments and enum values', () => {
        const entries = buildSchemaKnowledgeEntries([
            {
                table_schema: 'public',
                table_name: 'users',
                column_name: 'status',
                data_type: 'USER-DEFINED',
                column_comment: 'Lifecycle status.',
                enum_values: ['active', 'disabled']
            }
        ]);

        expect(entries).toEqual([
            expect.objectContaining({
                term: 'public.users.status',
                definition: 'Lifecycle status. Possible values: active, disabled.'
            })
        ]);
    });
});

describe('knowledgeRetrieval', () => {
    it('boosts docs that match requested table scope', () => {
        const ranked = rerankKnowledgeDocs('what does users deleted_at mean', [
            {
                id: '2',
                term: 'county',
                definition: 'Country meaning.',
                type: 'glossary',
                metadata: { table: 'orders' },
                score: 0.05
            },
            {
                id: '1',
                term: 'public.users.deleted_at',
                definition: '1999 means not deleted.',
                type: 'business_rule',
                metadata: { schema: 'public', table: 'users', column: 'deleted_at', aliases: ['deletedAt'] },
                score: 0.2
            }
        ], { schema: 'public', tables: ['public.users'], columns: ['deleted_at'] });

        expect(ranked[0]?.term).toBe('public.users.deleted_at');
    });
});
