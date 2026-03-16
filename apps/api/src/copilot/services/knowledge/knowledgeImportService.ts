import { PrismaClient } from '@prisma/client';
import { getProvider } from '../llm/providerFactory';
import { loadKnowledgeEntriesFromDirectory } from './knowledgeFileParser';
import { KnowledgeImportResult, NormalizedKnowledgeEntry } from './types';

const prisma = new PrismaClient();
const aiProvider = getProvider();

export async function importKnowledgeFromDirectory(directory: string): Promise<KnowledgeImportResult> {
    const parsed = await loadKnowledgeEntriesFromDirectory(directory);

    if (parsed.entries.length === 0) {
        return { ...parsed, imported: 0, updated: 0, skipped: parsed.errors.length };
    }

    const existingDocs = await prisma.semanticDoc.findMany({
        where: { term: { in: parsed.entries.map((entry) => entry.term) } },
        select: { term: true }
    });
    const existingTerms = new Set(existingDocs.map((doc) => doc.term));

    await upsertKnowledgeEntries(parsed.entries);

    return {
        imported: parsed.entries.filter((entry) => !existingTerms.has(entry.term)).length,
        updated: parsed.entries.filter((entry) => existingTerms.has(entry.term)).length,
        skipped: parsed.errors.length,
        files: parsed.files,
        errors: parsed.errors
    };
}

export async function upsertKnowledgeEntries(entries: NormalizedKnowledgeEntry[]): Promise<void> {
    if (entries.length === 0) return;
    const embeddings = await aiProvider.generateEmbeddings(entries.map(buildEmbeddingText));

    for (const [index, entry] of entries.entries()) {
        await prisma.$executeRaw`
            INSERT INTO "SemanticDoc" (id, term, definition, type, metadata, embedding, "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid(),
                ${entry.term},
                ${entry.definition},
                ${entry.type},
                ${JSON.stringify({ ...(entry.metadata || {}), source: entry.source, sourceKey: entry.sourceKey })}::jsonb,
                ${embeddings[index]}::vector,
                NOW(),
                NOW()
            )
            ON CONFLICT (term) DO UPDATE
            SET definition = EXCLUDED.definition,
                type = EXCLUDED.type,
                metadata = EXCLUDED.metadata,
                embedding = EXCLUDED.embedding,
                "updatedAt" = NOW()
        `;
    }
}

function buildEmbeddingText(entry: NormalizedKnowledgeEntry): string {
    return [entry.term, entry.type, entry.definition, JSON.stringify(entry.metadata || {})].join('\n');
}
