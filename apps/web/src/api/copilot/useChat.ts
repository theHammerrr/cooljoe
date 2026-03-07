import { useCallback, useState } from 'react';
import { fetchChat, streamChat } from './useChatClient';
import type { ChatParams, SendChatOptions } from './useChat.types';

export type { ChatResponse } from './useChat.types';

export function useChat() {
    const [isPending, setIsPending] = useState(false);

    const sendChat = useCallback(async (params: ChatParams, options: SendChatOptions) => {
        setIsPending(true);

        try {
            await streamChat(params, options);
        } catch (error) {
            console.error('Streaming chat failed, falling back to non-streaming response.', error);

            try {
                const data = await fetchChat(params);
                options.onChunk(data.message);
                options.onSuccess({ message: data.message, suggestedDraft: data.suggestedDraft });
            } catch (fallbackError) {
                console.error('Fallback chat failed.', fallbackError);
                options.onError();
            }
        } finally {
            setIsPending(false);
        }
    }, []);

    return { sendChat, isPending };
}
