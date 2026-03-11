import type { CopilotMessage } from './types';
import { buildConversationContext } from './conversationContext';
import { buildAssistantAnswerActions } from './assistantAnswerActions';
import { buildConversationMemory, buildConversationMemoryConstraints } from './conversationMemory';
import { createMessageId } from './messageIds';

interface HandleSendInput {
    messages: CopilotMessage[];
    setMessages: (updater: (prev: CopilotMessage[]) => CopilotMessage[]) => void;
    runDraft: (question: string, intent: 'sql' | 'prisma', constraints?: string) => void;
    topicId: string;
    sendChat: (
        input: { prompt: string; context?: unknown },
        options: {
            onChunk: (chunk: string) => void;
            onSuccess: (data: { message: string; suggestedDraft?: { question: string; mode: 'sql' | 'prisma'; reason?: string; constraints?: string; ctaLabel?: string } | null }) => void;
            onError: () => void;
        }
    ) => void | Promise<void>;
}

export function handleCopilotSend(
    input: HandleSendInput,
    text: string,
    intent: 'chat' | 'sql' | 'prisma'
) {
    input.setMessages((prev) => prev.concat({ id: createMessageId('user'), role: 'user', text, mode: intent }));

    if (intent !== 'chat') {
        const memory = buildConversationMemory(input.messages, text, input.topicId, intent);
        const memoryConstraints = buildConversationMemoryConstraints(memory);

        input.runDraft(text, intent, memoryConstraints);

        return;
    }

    const conversationContext = buildConversationContext(input.messages, text, input.topicId, intent);
    const assistantMessageId = createMessageId('assistant');

    input.setMessages((prev) => prev.concat({
        id: assistantMessageId,
        role: 'assistant',
        text: '',
        mode: 'chat'
    }));

    void input.sendChat({ prompt: text, context: conversationContext }, {
        onChunk: (chunk) => {
            input.setMessages((prev) => prev.map((message) => {
                if (message.id !== assistantMessageId) {
                    return message;
                }

                return {
                    ...message,
                    text: `${message.text}${chunk}`
                };
            }));
        },
        onSuccess: (data) => {
            const answerActions = buildAssistantAnswerActions(text, data.message);

            input.setMessages((prev) => prev.map((message) => {
                if (message.id !== assistantMessageId) {
                    return message;
                }

                return {
                    ...message,
                    ...answerActions,
                    text: data.message,
                    mode: 'chat',
                    suggestedDraft: data.suggestedDraft || answerActions.suggestedDraft || undefined
                };
            }));
        },
        onError: () => input.setMessages((prev) => prev.map((message) => {
            if (message.id !== assistantMessageId) {
                return message;
            }

            return {
                ...message,
                text: message.text || 'Chat failed.'
            };
        }))
    });
}
