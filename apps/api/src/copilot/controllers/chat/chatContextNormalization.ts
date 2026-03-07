interface ChatTurn {
    role: 'user' | 'assistant';
    text: string;
}

interface StructuredConversationMemory {
    topicId?: string;
    activeGoal?: string;
    preferredMode?: 'chat' | 'sql' | 'prisma';
    confirmedMetrics?: string[];
    confirmedDimensions?: string[];
    confirmedTimeGrain?: 'day' | 'week' | 'month' | 'year';
    confirmedTimeRange?: string;
    assistantQueryHints?: Array<{ mode: 'sql' | 'prisma'; query: string }>;
}

export function normalizeClientContext(context: unknown): Record<string, unknown> {
    if (typeof context !== 'object' || context === null) return {};

    return { ...context };
}

export function normalizeRecentTurns(context: Record<string, unknown>): ChatTurn[] {
    const rawTurns = Reflect.get(context, 'recentTurns');

    if (!Array.isArray(rawTurns)) return [];

    return rawTurns
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item): ChatTurn => ({ role: item.role === 'assistant' ? 'assistant' : 'user', text: String(item.text || '').trim() }))
        .filter((turn) => turn.text.length > 0)
        .slice(-6);
}

export function normalizeConversationSummary(context: Record<string, unknown>): string | undefined {
    const summary = Reflect.get(context, 'conversationSummary');

    if (typeof summary !== 'string') return undefined;
    const normalized = summary.trim();

    return normalized ? normalized.slice(-1000) : undefined;
}

export function normalizeConversationMemory(context: Record<string, unknown>): StructuredConversationMemory | undefined {
    const memory = Reflect.get(context, 'conversationMemory');

    if (typeof memory !== 'object' || memory === null) return undefined;

    return {
        topicId: normalizeOptionalString(Reflect.get(memory, 'topicId')),
        activeGoal: normalizeOptionalString(Reflect.get(memory, 'activeGoal')),
        preferredMode: normalizePreferredMode(Reflect.get(memory, 'preferredMode')),
        confirmedMetrics: normalizeStringArray(Reflect.get(memory, 'confirmedMetrics')),
        confirmedDimensions: normalizeStringArray(Reflect.get(memory, 'confirmedDimensions')),
        confirmedTimeGrain: normalizeTimeGrain(Reflect.get(memory, 'confirmedTimeGrain')),
        confirmedTimeRange: normalizeOptionalString(Reflect.get(memory, 'confirmedTimeRange')),
        assistantQueryHints: normalizeAssistantHints(Reflect.get(memory, 'assistantQueryHints'))
    };
}

export function normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();

    return normalized ? normalized.slice(0, 1000) : undefined;
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is string => typeof item === 'string').slice(0, 12);
}

function normalizeAssistantHints(value: unknown): Array<{ mode: 'sql' | 'prisma'; query: string }> {
    if (!Array.isArray(value)) return [];

    return value
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map(normalizeAssistantHint)
        .filter((item): item is { mode: 'sql' | 'prisma'; query: string } => item !== null)
        .slice(-2);
}

function normalizeAssistantHint(item: Record<string, unknown>) {
    const mode = Reflect.get(item, 'mode');
    const query = String(Reflect.get(item, 'query') || '').trim();

    if (!query) return null;

    return {
        mode: mode === 'prisma' ? 'prisma' : 'sql',
        query
    };
}

function normalizePreferredMode(value: unknown): 'chat' | 'sql' | 'prisma' | undefined {
    if (value === 'chat' || value === 'sql' || value === 'prisma') return value;

    return undefined;
}

function normalizeTimeGrain(value: unknown): StructuredConversationMemory['confirmedTimeGrain'] {
    if (value === 'day' || value === 'week' || value === 'month' || value === 'year') return value;

    return undefined;
}
