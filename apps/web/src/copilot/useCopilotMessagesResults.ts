import type { DraftJobResult } from '../api/copilot/useDraftQuery';
import { getDraftJob } from '../api/copilot/useDraftQuery';
import { clearActiveDraftSession } from './activeDraftSession';
import type { DraftMessagesState } from './useCopilotMessagesDraftState';
import { buildDraftResultMessages, toDraftQueryApiError } from './useCopilotMessagesHelpers';

export async function loadDraftJobResult(
    state: DraftMessagesState,
    requestId: string,
    statusToken: string,
    question: string,
    intent: 'sql' | 'prisma',
    preloadedJob?: DraftJobResult
) {
    try {
        const job = preloadedJob ?? await getDraftJob(requestId, statusToken);
        let appliedResult = false;

        state.setMessages((prev) => {
            const nextMessages = buildDraftResultMessages(prev, job, intent);
            appliedResult = Boolean(nextMessages);

            return nextMessages || prev;
        });

        if (!appliedResult) {
            state.handleDraftFailure(question, intent, toDraftQueryApiError(job.resultPayload));
        }
    } catch (error: unknown) {
        state.handleDraftFailure(question, intent, error);
    } finally {
        resetActiveDraftState(state);
    }
}

export function resetActiveDraftState(state: DraftMessagesState) {
    state.stopStatusPoll();
    state.setActiveDraftSession(null);
    clearActiveDraftSession();
    state.setDraftStatusText('');
    state.setIsDrafting(false);
    state.setIsCancellingDraft(false);
}
