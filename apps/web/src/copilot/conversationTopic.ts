const CONVERSATION_TOPIC_KEY = 'cooljoe.copilotTopicId';

export function loadConversationTopicId(): string {
    if (typeof window === 'undefined') {
        return createConversationTopicId();
    }

    const existing = window.localStorage.getItem(CONVERSATION_TOPIC_KEY);

    if (existing) return existing;
    const topicId = createConversationTopicId();

    window.localStorage.setItem(CONVERSATION_TOPIC_KEY, topicId);

    return topicId;
}

export function resetConversationTopicId(): string {
    const topicId = createConversationTopicId();

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONVERSATION_TOPIC_KEY, topicId);
    }

    return topicId;
}

export function clearConversationTopicId(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(CONVERSATION_TOPIC_KEY);
}

function createConversationTopicId(): string {
    return `topic_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
