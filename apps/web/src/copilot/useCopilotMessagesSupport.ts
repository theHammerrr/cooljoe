import { useCallback, useRef, useState } from 'react';
import type { ChatNotice } from './types';
import { createMessageId } from './messageIds';

export function useDraftResultTracker() {
    const handledDraftResultsRef = useRef<Set<string>>(new Set());

    const tryMarkDraftResultHandled = useCallback((requestId: string) => {
        if (handledDraftResultsRef.current.has(requestId)) return false;

        handledDraftResultsRef.current.add(requestId);

        return true;
    }, []);

    const clearHandledDraftResult = useCallback((requestId: string) => {
        handledDraftResultsRef.current.delete(requestId);
    }, []);

    return { tryMarkDraftResultHandled, clearHandledDraftResult };
}

export function useChatNoticeState() {
    const [notice, setNotice] = useState<ChatNotice | null>(null);

    const showNotice = useCallback((message: string, tone: ChatNotice['tone'] = 'success') => {
        setNotice({ id: createMessageId('notice'), message, tone });
    }, []);

    const dismissNotice = useCallback(() => {
        setNotice(null);
    }, []);

    return { notice, showNotice, dismissNotice };
}
