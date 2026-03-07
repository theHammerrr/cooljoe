import type { CopilotMessage } from './types';
import { buildConversationContext } from './conversationContext';
import { buildAssistantDraftSuggestion } from './assistantDraftSuggestion';

interface HandleSendInput {
    messages: CopilotMessage[];
    setMessages: (updater: (prev: CopilotMessage[]) => CopilotMessage[]) => void;
    runDraft: (question: string, intent: 'sql' | 'prisma', constraints?: string) => void;
    sendChat: (
        input: { prompt: string; context?: unknown },
        options: {
            onSuccess: (data: { message: string; suggestedDraft?: { question: string; mode: 'sql' | 'prisma'; reason?: string } | null }) => void;
            onError: () => void;
        }
    ) => void;
}

export function handleCopilotSend(
    input: HandleSendInput,
    text: string,
    intent: 'chat' | 'sql' | 'prisma'
) {
    input.setMessages((prev) => prev.concat({ id: Date.now().toString(), role: 'user', text, mode: intent }));

    if (intent !== 'chat') {
        input.runDraft(text, intent);

        return;
    }

    const conversationContext = buildConversationContext(input.messages, text);

    input.sendChat({ prompt: text, context: conversationContext }, {
        onSuccess: (data) => input.setMessages((prev) => prev.concat({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: data.message,
            mode: 'chat',
            suggestedDraft: buildAssistantDraftSuggestion(text, data.message) || data.suggestedDraft || undefined
        })),
        onError: () => input.setMessages((prev) => prev.concat({ id: `err-${Date.now()}`, role: 'assistant', text: 'Chat failed.' }))
    });
}
