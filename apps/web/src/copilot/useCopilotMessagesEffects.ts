import { useCallback, useEffect, useRef } from 'react';
import { subscribeToDraftStatus } from './draftStatus';
import { saveConversationTranscript } from './conversationTranscript';
import { saveWorkspaceSnapshot } from './workspaceSnapshot';
import type { CopilotMessage } from './types';

export function useDraftStatusPolling(setDraftStatusText: (value: string) => void) {
    const statusPollRef = useRef<(() => void) | null>(null);

    const stopStatusPoll = useCallback(() => {
        if (statusPollRef.current !== null) {
            statusPollRef.current();
            statusPollRef.current = null;
        }
    }, []);

    const startStatusPoll = useCallback((requestId: string, statusToken: string, onDone: () => void) => {
        stopStatusPoll();
        statusPollRef.current = subscribeToDraftStatus(requestId, statusToken, setDraftStatusText, () => onDone());
    }, [setDraftStatusText, stopStatusPoll]);

    useEffect(() => () => stopStatusPoll(), [stopStatusPoll]);

    return { stopStatusPoll, startStatusPoll };
}

export function useCopilotPersistence(messages: CopilotMessage[], tableResults: Record<string, unknown>[] | null) {
    useEffect(() => {
        saveConversationTranscript(messages);
    }, [messages]);

    useEffect(() => {
        saveWorkspaceSnapshot(tableResults);
    }, [tableResults]);
}
