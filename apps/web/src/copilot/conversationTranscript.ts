import { isQueryBlock, type CopilotMessage } from './types';

const CONVERSATION_TRANSCRIPT_KEY = 'cooljoe.copilotTranscript';
const MAX_PERSISTED_MESSAGES = 30;

export function loadConversationTranscript(): CopilotMessage[] {
    if (typeof window === 'undefined') return [];

    try {
        const rawValue = window.localStorage.getItem(CONVERSATION_TRANSCRIPT_KEY);

        if (!rawValue) return [];

        const parsed: unknown = JSON.parse(rawValue);

        if (!Array.isArray(parsed)) return [];

        return parsed.filter(isPersistedCopilotMessage);
    } catch {
        return [];
    }
}

export function saveConversationTranscript(messages: CopilotMessage[]): void {
    if (typeof window === 'undefined') return;

    const persistedMessages = messages
        .filter(isPersistableCopilotMessage)
        .slice(-MAX_PERSISTED_MESSAGES);

    if (persistedMessages.length === 0) {
        window.localStorage.removeItem(CONVERSATION_TRANSCRIPT_KEY);

        return;
    }

    window.localStorage.setItem(CONVERSATION_TRANSCRIPT_KEY, JSON.stringify(persistedMessages));
}

export function clearConversationTranscript(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(CONVERSATION_TRANSCRIPT_KEY);
}

function isPersistableCopilotMessage(message: CopilotMessage): boolean {
    return message.role === 'user' || message.role === 'assistant';
}

function isPersistedCopilotMessage(value: unknown): value is CopilotMessage {
    if (!value || typeof value !== 'object') return false;

    const role = Reflect.get(value, 'role');
    const text = Reflect.get(value, 'text');
    const id = Reflect.get(value, 'id');
    const queryBlock = Reflect.get(value, 'queryBlock');
    const mode = Reflect.get(value, 'mode');
    const retryDraft = Reflect.get(value, 'retryDraft');
    const suggestedDraft = Reflect.get(value, 'suggestedDraft');
    const runError = Reflect.get(value, 'runError');

    return (
        typeof id === 'string' &&
        (role === 'user' || role === 'assistant') &&
        typeof text === 'string' &&
        (queryBlock === undefined || isQueryBlock(queryBlock)) &&
        (mode === undefined || mode === 'chat' || mode === 'sql' || mode === 'prisma') &&
        (retryDraft === undefined || isRetryDraft(retryDraft)) &&
        (suggestedDraft === undefined || isSuggestedDraft(suggestedDraft)) &&
        (runError === undefined || typeof runError === 'string')
    );
}

function isRetryDraft(value: unknown): value is NonNullable<CopilotMessage['retryDraft']> {
    return (
        !!value &&
        typeof value === 'object' &&
        typeof Reflect.get(value, 'question') === 'string' &&
        (Reflect.get(value, 'mode') === 'sql' || Reflect.get(value, 'mode') === 'prisma') &&
        typeof Reflect.get(value, 'constraints') === 'string'
    );
}

function isSuggestedDraft(value: unknown): value is NonNullable<CopilotMessage['suggestedDraft']> {
    return (
        !!value &&
        typeof value === 'object' &&
        typeof Reflect.get(value, 'question') === 'string' &&
        (Reflect.get(value, 'mode') === 'sql' || Reflect.get(value, 'mode') === 'prisma') &&
        (Reflect.get(value, 'reason') === undefined || typeof Reflect.get(value, 'reason') === 'string')
    );
}
