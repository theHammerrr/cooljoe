import { retrievalService } from '../../services/retrievalService';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from '../draftQuery/schemaContext';
import { inferKnowledgeScope, groupKnowledgeDocs } from '../../services/knowledge/knowledgeRetrieval';
import {
    normalizeClientContext,
    normalizeConversationMemory,
    normalizeConversationSummary,
    normalizeOptionalString,
    normalizeRecentTurns
} from './chatContextNormalization';

interface BuildChatContextInput {
    prompt: string;
    context?: unknown;
}

export async function buildChatContext(input: BuildChatContextInput): Promise<Record<string, unknown>> {
    console.time('chat-context-build');
    const clientContext = normalizeClientContext(input.context);
    const recentTurns = normalizeRecentTurns(clientContext);
    const conversationSummary = normalizeConversationSummary(clientContext);
    const conversationMemory = normalizeConversationMemory(clientContext);
    const topicId = normalizeOptionalString(Reflect.get(clientContext, 'topicId'));
    const schema = await retrievalService.getLatestSchema();
    const requestedSchema = detectRequestedSchema(input.prompt, schema);
    const tableCatalog = buildTableCatalog(schema, requestedSchema).slice(0, 30);
    const joinGraph = buildJoinGraph(schema, requestedSchema).slice(0, 60);
    const knowledgeScope = inferKnowledgeScope(input.prompt, schema);
    const [glossary, similarExamples] = await Promise.all([
        retrievalService.findRelevantDocs(input.prompt, { ...knowledgeScope, limit: 4 }),
        retrievalService.findRelevantRecipes(input.prompt, { ...knowledgeScope, limit: 3 })
    ]);

    console.timeEnd('chat-context-build');

    return {
        ...clientContext,
        productScope: 'database-copilot',
        schema,
        requestedSchema,
        tableCatalog,
        joinGraph,
        knowledgeScope,
        glossary,
        knowledgeContext: groupKnowledgeDocs(glossary),
        similarExamples,
        recentTurns,
        conversationSummary,
        conversationMemory,
        topicId
    };
}
