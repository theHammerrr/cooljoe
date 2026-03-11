import { retrievalService } from '../../services/retrievalService';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from '../draftQuery/schemaContext';
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

    const [schema, glossary, similarExamples] = await Promise.all([
        retrievalService.getLatestSchema(),
        retrievalService.findRelevantDocs(input.prompt, 2),
        retrievalService.findRelevantRecipes(input.prompt, 2)
    ]);

    const requestedSchema = detectRequestedSchema(input.prompt, schema);
    const tableCatalog = buildTableCatalog(schema, requestedSchema).slice(0, 30);
    const joinGraph = buildJoinGraph(schema, requestedSchema).slice(0, 60);

    console.timeEnd('chat-context-build');

    return {
        ...clientContext,
        productScope: 'database-copilot',
        requestedSchema,
        tableCatalog,
        joinGraph,
        glossary,
        similarExamples,
        recentTurns,
        conversationSummary,
        conversationMemory,
        topicId
    };
}
