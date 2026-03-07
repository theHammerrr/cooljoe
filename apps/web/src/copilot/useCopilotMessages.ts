import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../api/copilot/useChat';
import { type CopilotMessage } from './types';
import { subscribeToDraftStatus } from './draftStatus';
import { type ActiveDraftSession } from './activeDraftSession';
import { saveConversationTranscript } from './conversationTranscript';
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot } from './workspaceSnapshot';
import {
    buildDraftFailureMessages,
} from './useCopilotMessagesHelpers';
import {
    cancelActiveDraft,
    resumeDraftSession,
    runDraftJob
} from './useCopilotMessagesDraft';
import { loadInitialCopilotMessages } from './useCopilotMessagesInitialState';
import { handleCopilotSend } from './useCopilotChatSend';
import { clearPersistedCopilotState } from './clearCopilotState';

export function useCopilotMessages() {
    const initialState = useMemo(() => loadInitialCopilotMessages(), []);
    const initialWorkspaceSnapshot = loadWorkspaceSnapshot();
    const [messages, setMessages] = useState<CopilotMessage[]>(() => initialState.messages);
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(initialWorkspaceSnapshot.tableResults);
    const [draftStatusText, setDraftStatusText] = useState<string>('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [isCancellingDraft, setIsCancellingDraft] = useState(false);
    const { mutate: sendChat, isPending: isChatting } = useChat();
    const statusPollRef = useRef<(() => void) | null>(null);
    const activeDraftSessionRef = useRef<ActiveDraftSession | null>(null);

    const stopStatusPoll = useCallback(() => {
        if (statusPollRef.current !== null) {
            statusPollRef.current();
            statusPollRef.current = null;
        }
    }, []);

    useEffect(() => () => stopStatusPoll(), [stopStatusPoll]);
    useEffect(() => {
        saveConversationTranscript(messages);
    }, [messages]);
    useEffect(() => {
        saveWorkspaceSnapshot(tableResults);
    }, [tableResults]);

    const startStatusPoll = useCallback((requestId: string, statusToken: string, onDone: () => void) => {
        stopStatusPoll();
        statusPollRef.current = subscribeToDraftStatus(requestId, statusToken, setDraftStatusText, () => onDone());
    }, [stopStatusPoll]);

    const handleDraftFailure = useCallback((question: string, intent: 'sql' | 'prisma', error: unknown) => {
        setMessages((prev) => buildDraftFailureMessages(prev, question, intent, error));
    }, []);
    const setActiveDraftSession = useCallback((value: ActiveDraftSession | null) => {
        activeDraftSessionRef.current = value;
    }, []);
    const draftState = useMemo(() => ({
        stopStatusPoll,
        setDraftStatusText,
        setIsDrafting,
        setIsCancellingDraft,
        setMessages,
        setActiveDraftSession,
        handleDraftFailure
    }), [handleDraftFailure, setActiveDraftSession, stopStatusPoll]);
    const runDraft = useCallback((question: string, intent: 'sql' | 'prisma', constraints?: string) => {
        void runDraftJob(draftState, startStatusPoll, question, intent, constraints);
    }, [draftState, startStatusPoll]);

    const cancelCurrentDraft = useCallback(async () => {
        const activeDraftSession = activeDraftSessionRef.current;

        if (!activeDraftSession || isCancellingDraft) return;

        await cancelActiveDraft(draftState, activeDraftSession);
    }, [draftState, isCancellingDraft]);
    const clearChat = useCallback(async () => {
        const activeDraftSession = activeDraftSessionRef.current;

        if (activeDraftSession && !isCancellingDraft) {
            await cancelActiveDraft(draftState, activeDraftSession);
        }

        stopStatusPoll();
        activeDraftSessionRef.current = null;
        clearPersistedCopilotState();
        setMessages([]);
        setTableResults(null);
        setDraftStatusText('');
        setIsDrafting(false);
        setIsCancellingDraft(false);
    }, [draftState, isCancellingDraft, stopStatusPoll]);

    useEffect(() => {
        const activeDraftSession = initialState.activeDraftSession;

        if (!activeDraftSession) return;

        void resumeDraftSession(draftState, activeDraftSession, startStatusPoll);
    }, [draftState, initialState, startStatusPoll]);

    const handleSend = useCallback((text: string, intent: 'chat' | 'sql' | 'prisma') => {
        handleCopilotSend({ messages, setMessages, runDraft, sendChat }, text, intent);
    }, [messages, runDraft, sendChat]);

    return { messages, setMessages, tableResults, setTableResults, runDraft, handleSend, cancelCurrentDraft, clearChat, isDrafting, isCancellingDraft, isChatting, draftStatusText };
}
