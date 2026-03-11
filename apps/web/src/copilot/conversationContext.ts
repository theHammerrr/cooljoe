import type { CopilotMessage } from './types';
import { buildConversationMemory } from './conversationMemory';

interface ConversationTurn {
    role: 'user' | 'assistant';
    text: string;
}

const MAX_RECENT_TURNS = 6;
const MAX_SUMMARY_TURNS = 6;
const MAX_SUMMARY_CHARS = 900;

export function buildConversationContext(
    messages: CopilotMessage[],
    nextUserText: string,
    topicId: string,
    preferredMode: 'chat' | 'sql' | 'prisma' = 'chat'
) {
    const turns = messages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message): ConversationTurn => ({ role: message.role, text: message.text.trim() }))
        .filter((turn) => turn.text.length > 0);
    const recentTurns = turns.slice(-MAX_RECENT_TURNS).concat({ role: 'user', text: nextUserText });
    const olderTurns = turns.slice(0, Math.max(0, turns.length - MAX_RECENT_TURNS)).slice(-MAX_SUMMARY_TURNS);

    return {
        topicId,
        recentTurns,
        conversationSummary: summarizeTurns(olderTurns),
        conversationMemory: buildConversationMemory(messages, nextUserText, topicId, preferredMode),
        contextPolicy: {
            strategy: 'focused_recent_turns_with_structured_memory',
            maxRecentTurns: MAX_RECENT_TURNS,
            note: 'Recent turns are prioritized. Older context is summarized. Start a new topic when switching tasks.'
        }
    };
}

function summarizeTurns(turns: ConversationTurn[]): string | undefined {
    if (turns.length === 0) return undefined;
    const summary = turns
        .map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}`)
        .join('\n')
        .slice(-MAX_SUMMARY_CHARS);

    return summary || undefined;
}
