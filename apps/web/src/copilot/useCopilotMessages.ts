import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../api/copilot/useChat';
import { type CopilotMessage } from './types';
import { type ActiveDraftSession } from './activeDraftSession';
import { loadWorkspaceSnapshot } from './workspaceSnapshot';
import {
    buildDraftFailureMessages,
} from './useCopilotMessagesHelpers';
import { pruneStaleDraftFailureMessages } from './useCopilotMessagesRetryCleanup';
import {
    cancelActiveDraft,
    resumeDraftSession,
    runDraftJob
} from './useCopilotMessagesDraft';
import { loadInitialCopilotMessages } from './useCopilotMessagesInitialState';
import { handleCopilotSend } from './useCopilotChatSend';
import { loadConversationTopicId } from './conversationTopic';
import { clearCopilotChatState, startFreshCopilotTopic } from './useCopilotMessagesTopic';
import { useCopilotPersistence, useDraftStatusPolling } from './useCopilotMessagesEffects';
import { useChatNoticeState, useDraftResultTracker } from './useCopilotMessagesSupport';

export function useCopilotMessages() {
    const initialState = useMemo(() => loadInitialCopilotMessages(), []);
    const initialWorkspaceSnapshot = loadWorkspaceSnapshot();
    const [topicId, setTopicId] = useState(() => loadConversationTopicId());
    const [messages, setMessages] = useState<CopilotMessage[]>(() => initialState.messages);
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(initialWorkspaceSnapshot.tableResults);
    const [draftStatusText, setDraftStatusText] = useState<string>('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [isCancellingDraft, setIsCancellingDraft] = useState(false);
    const { notice, showNotice, dismissNotice } = useChatNoticeState();
    const { sendChat, isPending: isChatting } = useChat();
    const activeDraftSessionRef = useRef<ActiveDraftSession | null>(null);
    const { tryMarkDraftResultHandled, clearHandledDraftResult } = useDraftResultTracker();
    const { stopStatusPoll, startStatusPoll } = useDraftStatusPolling(setDraftStatusText);

    useCopilotPersistence(messages, tableResults);

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
        handleDraftFailure,
        tryMarkDraftResultHandled,
        clearHandledDraftResult
    }), [clearHandledDraftResult, handleDraftFailure, setActiveDraftSession, stopStatusPoll, tryMarkDraftResultHandled]);
    const runDraft = useCallback((question: string, intent: 'sql' | 'prisma', constraints?: string) => {
        setMessages((prev) => pruneStaleDraftFailureMessages(prev, question, intent));
        void runDraftJob(draftState, startStatusPoll, question, intent, constraints);
    }, [draftState, startStatusPoll]);

    const cancelCurrentDraft = useCallback(async () => {
        const activeDraftSession = activeDraftSessionRef.current;

        if (!activeDraftSession || isCancellingDraft) return;

        await cancelActiveDraft(draftState, activeDraftSession);
    }, [draftState, isCancellingDraft]);
    const clearChat = useCallback(async () => {
        await clearCopilotChatState({ ...draftState, setTopicId, setTableResults }, activeDraftSessionRef.current, isCancellingDraft);
    }, [draftState, isCancellingDraft]);

    const startNewTopic = useCallback(async () => {
        await startFreshCopilotTopic({ ...draftState, setTopicId, setTableResults }, activeDraftSessionRef.current, isCancellingDraft);
    }, [draftState, isCancellingDraft]);

    useEffect(() => {
        const activeDraftSession = initialState.activeDraftSession;

        if (!activeDraftSession) return;

        void resumeDraftSession(draftState, activeDraftSession, startStatusPoll);
    }, [draftState, initialState, startStatusPoll]);

    const handleSend = useCallback((text: string, intent: 'chat' | 'sql' | 'prisma') => {
        handleCopilotSend({ messages, setMessages, runDraft, sendChat, topicId }, text, intent);
    }, [messages, runDraft, sendChat, topicId]);

    return {
        messages,
        setMessages,
        tableResults,
        setTableResults,
        runDraft,
        handleSend,
        cancelCurrentDraft,
        clearChat,
        startNewTopic,
        isDrafting,
        isCancellingDraft,
        isChatting,
        draftStatusText,
        topicId,
        notice,
        showNotice,
        dismissNotice
    };
}
