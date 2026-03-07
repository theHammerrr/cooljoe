import type { CopilotMessage } from './types';

interface ConversationTurn {
    role: 'user' | 'assistant';
    text: string;
}

const MAX_RECENT_TURNS = 6;
const MAX_SUMMARY_TURNS = 6;
const MAX_SUMMARY_CHARS = 900;

export function buildConversationContext(messages: CopilotMessage[], nextUserText: string) {
    const turns = messages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message): ConversationTurn => ({ role: message.role, text: message.text.trim() }))
        .filter((turn) => turn.text.length > 0);
    const recentTurns = turns.slice(-MAX_RECENT_TURNS).concat({ role: 'user', text: nextUserText });
    const olderTurns = turns.slice(0, Math.max(0, turns.length - MAX_RECENT_TURNS)).slice(-MAX_SUMMARY_TURNS);

    return {
        recentTurns,
        conversationSummary: summarizeTurns(olderTurns),
        contextPolicy: {
            strategy: 'focused_recent_turns',
            maxRecentTurns: MAX_RECENT_TURNS,
            note: 'Older messages are summarized. Clear chat when switching topics.'
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
