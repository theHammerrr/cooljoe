import type { CopilotMessage } from './types';

export interface ConversationMemory {
    topicId: string;
    activeGoal?: string;
    preferredMode?: 'chat' | 'sql' | 'prisma';
    confirmedMetrics: string[];
    confirmedDimensions: string[];
    confirmedTimeGrain?: 'day' | 'week' | 'month' | 'year';
    confirmedTimeRange?: string;
    assistantQueryHints: Array<{ mode: 'sql' | 'prisma'; query: string }>;
}

const METRIC_PATTERNS = ['revenue', 'amount', 'count', 'orders', 'sales', 'gmv', 'arr', 'mrr'];
const DIMENSION_PATTERNS = ['customer', 'employee', 'job', 'product', 'status', 'name', 'description', 'month', 'week', 'day', 'year'];

export function buildConversationMemory(
    messages: CopilotMessage[],
    nextUserText: string | undefined,
    topicId: string,
    preferredMode?: 'chat' | 'sql' | 'prisma'
): ConversationMemory {
    const userTexts = messages.filter((message) => message.role === 'user').map((message) => message.text);
    const allTexts = userTexts.concat(nextUserText ? [nextUserText] : []);
    const activeGoal = nextUserText?.trim() || userTexts.at(-1)?.trim() || undefined;
    const queryHints = messages.flatMap(extractAssistantQueryHint).slice(-2);

    return {
        topicId,
        activeGoal,
        preferredMode: preferredMode || findPreferredMode(messages),
        confirmedMetrics: collectPatternMatches(allTexts, METRIC_PATTERNS),
        confirmedDimensions: collectPatternMatches(allTexts, DIMENSION_PATTERNS),
        confirmedTimeGrain: detectTimeGrain(allTexts),
        confirmedTimeRange: detectTimeRange(allTexts),
        assistantQueryHints: queryHints
    };
}

export function buildConversationMemoryConstraints(memory: ConversationMemory): string | undefined {
    const parts: string[] = [];

    if (memory.topicId) parts.push(`Conversation topic: ${memory.topicId}`);

    if (memory.activeGoal) parts.push(`Current goal from chat context: ${memory.activeGoal}`);

    if (memory.preferredMode && memory.preferredMode !== 'chat') parts.push(`Preferred query mode from chat context: ${memory.preferredMode}`);

    if (memory.confirmedMetrics.length > 0) parts.push(`Confirmed metrics: ${memory.confirmedMetrics.join(', ')}`);

    if (memory.confirmedDimensions.length > 0) parts.push(`Confirmed dimensions: ${memory.confirmedDimensions.join(', ')}`);

    if (memory.confirmedTimeGrain) parts.push(`Confirmed time grain: ${memory.confirmedTimeGrain}`);

    if (memory.confirmedTimeRange) parts.push(`Confirmed time range: ${memory.confirmedTimeRange}`);

    const latestHint = memory.assistantQueryHints.at(-1);

    if (latestHint) {
        parts.push(`Latest assistant ${latestHint.mode.toUpperCase()} hint:\n${latestHint.query}`);
    }

    return parts.length > 0 ? parts.join('\n\n') : undefined;
}

function findPreferredMode(messages: CopilotMessage[]): 'chat' | 'sql' | 'prisma' | undefined {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const mode = messages[index]?.mode;

        if (mode === 'chat' || mode === 'sql' || mode === 'prisma') return mode;
    }

    return undefined;
}

function collectPatternMatches(texts: string[], patterns: string[]): string[] {
    const matches = new Set<string>();
    const normalizedTexts = texts.map((text) => text.toLowerCase());

    for (const pattern of patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');

        if (normalizedTexts.some((text) => regex.test(text))) {
            matches.add(pattern);
        }
    }

    return Array.from(matches);
}

function detectTimeGrain(texts: string[]): ConversationMemory['confirmedTimeGrain'] {
    const combined = texts.join(' ').toLowerCase();

    if (/\bby day\b|\bdaily\b/.test(combined)) return 'day';

    if (/\bby week\b|\bweekly\b/.test(combined)) return 'week';

    if (/\bby month\b|\bmonthly\b/.test(combined)) return 'month';

    if (/\bby year\b|\byearly\b/.test(combined)) return 'year';

    return undefined;
}

function detectTimeRange(texts: string[]): string | undefined {
    const combined = texts.join(' ');
    const matched = combined.match(/\b(last\s+\d+\s+(?:day|days|week|weeks|month|months|year|years)|today|yesterday|this month|this week|this year)\b/i);

    return matched?.[1];
}

function extractAssistantQueryHint(message: CopilotMessage): Array<{ mode: 'sql' | 'prisma'; query: string }> {
    if (message.role !== 'assistant') return [];

    if (message.queryBlock?.sql) {
        return [{ mode: 'sql', query: message.queryBlock.sql }];
    }

    const suggestedConstraints = message.suggestedDraft?.constraints?.trim();

    if (message.suggestedDraft && suggestedConstraints) {
        return [{ mode: message.suggestedDraft.mode, query: suggestedConstraints.slice(0, 600) }];
    }

    return [];
}
