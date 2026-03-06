import { retrievalService } from '../../services/retrievalService';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from '../draftQuery/schemaContext';

interface ChatTurn {
    role: 'user' | 'assistant';
    text: string;
}

interface BuildChatContextInput {
    prompt: string;
    context?: unknown;
}

function normalizeClientContext(context: unknown): Record<string, unknown> {
    if (typeof context !== 'object' || context === null) return {};

    return { ...context };
}

function normalizeRecentTurns(context: Record<string, unknown>): ChatTurn[] {
    const rawTurns = Reflect.get(context, 'recentTurns');

    if (!Array.isArray(rawTurns)) return [];

    return rawTurns
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item): ChatTurn => ({ role: item.role === 'assistant' ? 'assistant' : 'user', text: String(item.text || '').trim() }))
        .filter((turn) => turn.text.length > 0)
        .slice(-6);
}

export async function buildChatContext(input: BuildChatContextInput): Promise<Record<string, unknown>> {
    console.time('chat-context-build');
    const clientContext = normalizeClientContext(input.context);
    const recentTurns = normalizeRecentTurns(clientContext);

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
        recentTurns
    };
}
