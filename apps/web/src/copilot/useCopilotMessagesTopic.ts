import { cancelActiveDraft } from './useCopilotMessagesDraft';
import { clearPersistedCopilotState } from './clearCopilotState';
import { loadConversationTopicId, resetConversationTopicId } from './conversationTopic';
import type { DraftMessagesState } from './useCopilotMessagesDraftState';
import type { ActiveDraftSession } from './activeDraftSession';

interface TopicActionState extends DraftMessagesState {
    setTopicId: (value: string) => void;
    setTableResults: (value: Record<string, unknown>[] | null) => void;
}

export async function clearCopilotChatState(
    state: TopicActionState,
    activeDraftSession: ActiveDraftSession | null,
    isCancellingDraft: boolean
) {
    if (activeDraftSession && !isCancellingDraft) {
        await cancelActiveDraft(state, activeDraftSession);
    }

    state.stopStatusPoll();
    state.setActiveDraftSession(null);
    clearPersistedCopilotState();
    state.setTopicId(loadConversationTopicId());
    resetVisibleState(state);
}

export async function startFreshCopilotTopic(
    state: TopicActionState,
    activeDraftSession: ActiveDraftSession | null,
    isCancellingDraft: boolean
) {
    if (activeDraftSession && !isCancellingDraft) {
        await cancelActiveDraft(state, activeDraftSession);
    }

    state.stopStatusPoll();
    state.setActiveDraftSession(null);
    state.setTopicId(resetConversationTopicId());
    resetVisibleState(state);
}

function resetVisibleState(state: TopicActionState) {
    state.setMessages(() => []);
    state.setTableResults(null);
    state.setDraftStatusText('');
    state.setIsDrafting(false);
    state.setIsCancellingDraft(false);
}
