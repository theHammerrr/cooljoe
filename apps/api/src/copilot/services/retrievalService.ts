import { PrismaClient } from '@prisma/client';
import { getProvider } from './llm/providerFactory';
import { KnowledgeRetrievalOptions, NormalizedKnowledgeEntry, RetrievedKnowledgeDoc, RetrievedRecipe } from './knowledge/types';
import { rerankKnowledgeDocs, rerankRecipes } from './knowledge/knowledgeRetrieval';
import { upsertKnowledgeEntries } from './knowledge/knowledgeImportService';

const prisma = new PrismaClient();
const aiProvider = getProvider();

type NormalizedRetrievalOptions = { limit: number; schema?: string; tables: string[]; columns: string[]; types: string[] };

export class RetrievalService {
    async findRelevantRecipes(question: string, limitOrOptions: number | KnowledgeRetrievalOptions = 3) {
        const options = normalizeRetrievalOptions(limitOrOptions);
        const [embedding] = await aiProvider.generateEmbeddings([question]);
        const recipes = await prisma.$queryRaw<RetrievedRecipe[]>`
            SELECT id, intent, "sqlQuery", "prismaQuery", tags, metadata, embedding <=> ${embedding}::vector AS score
            FROM "QueryRecipe"
            ORDER BY embedding <=> ${embedding}::vector
            LIMIT 25
        `;

        return rerankRecipes(question, recipes, options).slice(0, options.limit);
    }

    async findRelevantDocs(question: string, limitOrOptions: number | KnowledgeRetrievalOptions = 3) {
        const options = normalizeRetrievalOptions(limitOrOptions);
        const [embedding] = await aiProvider.generateEmbeddings([question]);
        const docs = await prisma.$queryRaw<RetrievedKnowledgeDoc[]>`
            SELECT id, term, definition, type, metadata, embedding <=> ${embedding}::vector AS score
            FROM "SemanticDoc"
            ORDER BY embedding <=> ${embedding}::vector
            LIMIT 25
        `;

        return rerankKnowledgeDocs(question, docs, options).filter((doc) => matchesRequestedTypes(doc.type, options.types)).slice(0, options.limit);
    }

    async getLatestSchema() {
        const snapshot = await prisma.schemaSnapshot.findFirst({ orderBy: { createdAt: 'desc' } });

        return snapshot?.topology || {};
    }

    async saveAcceptedRecipe(intent: string, sqlQuery: string, prismaQuery?: string, tags: string[] = [], metadata?: Record<string, unknown>) {
        const [embedding] = await aiProvider.generateEmbeddings([intent]);

        await prisma.$executeRaw`
            INSERT INTO "QueryRecipe" (id, intent, "sqlQuery", "prismaQuery", tags, metadata, embedding, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${intent}, ${sqlQuery}, ${prismaQuery || null}, ARRAY[${tags}]::text[], ${JSON.stringify(metadata || null)}::jsonb, ${embedding}::vector, NOW(), NOW())
        `;

        return true;
    }

    async upsertKnowledgeEntries(entries: NormalizedKnowledgeEntry[]) {
        await upsertKnowledgeEntries(entries);
    }
}

function normalizeRetrievalOptions(limitOrOptions: number | KnowledgeRetrievalOptions): NormalizedRetrievalOptions {
    if (typeof limitOrOptions === 'number') return { limit: limitOrOptions, tables: [], columns: [], types: [] };

    return { limit: limitOrOptions.limit ?? 3, schema: limitOrOptions.schema ?? undefined, tables: limitOrOptions.tables || [], columns: limitOrOptions.columns || [], types: limitOrOptions.types || [] };
}

function matchesRequestedTypes(type: string, requestedTypes: string[]) { return requestedTypes.length === 0 || requestedTypes.includes(type); }
export const retrievalService = new RetrievalService();
