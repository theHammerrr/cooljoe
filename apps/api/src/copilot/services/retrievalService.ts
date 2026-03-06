import { PrismaClient } from '@prisma/client';
import { getProvider } from './llm/providerFactory';

const prisma = new PrismaClient();
const aiProvider = getProvider();

export class RetrievalService {

    /**
     * Finds the closest Query Recipes based on the question vector
     */
    async findRelevantRecipes(question: string, limit: number = 3) {
        // Embed the user question
        const [embedding] = await aiProvider.generateEmbeddings([question]);

        // Ensure pgvector extension is handling cosine similarity via '<=>'
        const recipes = await prisma.$queryRaw`
            SELECT id, intent, "sqlQuery", "prismaQuery", tags, metadata 
            FROM "QueryRecipe"
            ORDER BY embedding <=> ${embedding}::vector
            LIMIT ${limit}
        `;

        return recipes;
    }

    /**
     * Finds the closest Semantic Docs (glossary definitions)
     */
    async findRelevantDocs(question: string, limit: number = 3) {
        const [embedding] = await aiProvider.generateEmbeddings([question]);

        const docs = await prisma.$queryRaw`
            SELECT id, term, definition, type, metadata 
            FROM "SemanticDoc"
            ORDER BY embedding <=> ${embedding}::vector
            LIMIT ${limit}
        `;

        return docs;
    }

    /**
     * Retrieves the latest Schema Snapshot
     */
    async getLatestSchema() {
        const snapshot = await prisma.schemaSnapshot.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        return snapshot?.topology || {};
    }

    /**
     * Stores an accepted recipe with an embedding
     */
    async saveAcceptedRecipe(intent: string, sqlQuery: string, prismaQuery?: string, tags: string[] = []) {
        // Generate embedding from intent
        const [embedding] = await aiProvider.generateEmbeddings([intent]);

        // Note: Using an exact insert since prisma's regular API doesn't fully type unsupported vector fields natively
        await prisma.$executeRaw`
            INSERT INTO "QueryRecipe" (id, intent, "sqlQuery", "prismaQuery", tags, embedding, "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid(), 
                ${intent}, 
                ${sqlQuery}, 
                ${prismaQuery || null}, 
                ARRAY[${tags}]::text[], 
                ${embedding}::vector,
                NOW(),
                NOW()
            )
        `;

        return true;
    }
}

export const retrievalService = new RetrievalService();
