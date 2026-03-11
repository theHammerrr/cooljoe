import type { DraftJobResult } from '../api/copilot/useDraftQuery';
import { getDraftJob } from '../api/copilot/useDraftQuery';
import { clearActiveDraftSession } from './activeDraftSession';
import type { DraftMessagesState } from './useCopilotMessagesDraftState';
import { buildDraftResultMessages, hasRenderableDraftResult, toDraftQueryApiError } from './useCopilotMessagesHelpers';

export async function loadDraftJobResult(
    state: DraftMessagesState,
    requestId: string,
    statusToken: string,
    question: string,
    intent: 'sql' | 'prisma',
    preloadedJob?: DraftJobResult
) {
    if (!state.tryMarkDraftResultHandled(requestId)) {
        resetActiveDraftState(state);

        return;
    }

    try {
        const job = preloadedJob ?? await getDraftJob(requestId, statusToken);
        const hasResult = hasRenderableDraftResult(job);

        if (hasResult) {
            state.setMessages((prev) => buildDraftResultMessages(prev, job, intent) || prev);
        }

        if (!hasResult) {
            state.handleDraftFailure(question, intent, toDraftQueryApiError(job.resultPayload));
        }
    } catch (error: unknown) {
        console.error('Failed to load completed draft job result.', { requestId, error });
        state.clearHandledDraftResult(requestId);
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
