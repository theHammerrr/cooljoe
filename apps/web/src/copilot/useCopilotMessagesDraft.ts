import { cancelDraftJob, createDraftJob, getDraftJob } from '../api/copilot/useDraftQuery';
import { clearActiveDraftSession, saveActiveDraftSession, type ActiveDraftSession } from './activeDraftSession';
import { toStatusText } from './draftStatus.shared';
import type { DraftMessagesState } from './useCopilotMessagesDraftState';
import { loadDraftJobResult, resetActiveDraftState } from './useCopilotMessagesResults';

export async function runDraftJob(
    state: DraftMessagesState,
    startStatusPoll: (requestId: string, statusToken: string, onDone: () => void) => void,
    question: string,
    intent: 'sql' | 'prisma',
    constraints?: string
) {
    state.setIsDrafting(true);

    try {
        const draftToken = await createDraftJob({ question, preferred: intent, constraints });
        const activeDraftSession: ActiveDraftSession = {
            requestId: draftToken.requestId,
            statusToken: draftToken.statusToken,
            question,
            intent,
            constraints,
            startedAt: Date.now()
        };

        state.setActiveDraftSession(activeDraftSession);
        saveActiveDraftSession(activeDraftSession);
        startStatusPoll(draftToken.requestId, draftToken.statusToken, () => {
            void loadDraftJobResult(state, draftToken.requestId, draftToken.statusToken, question, intent);
        });
    } catch {
        resetActiveDraftState(state);
        state.setMessages((prev) => prev.concat({ id: `err-${Date.now()}`, role: 'assistant', text: "Sorry, I couldn't generate a query." }));
    }
}

export async function cancelActiveDraft(
    state: DraftMessagesState,
    activeDraftSession: ActiveDraftSession
) {
    state.setIsCancellingDraft(true);
    state.setDraftStatusText('Cancelling draft...');

    try {
        await cancelDraftJob(activeDraftSession.requestId, activeDraftSession.statusToken);
        state.stopStatusPoll();
        state.setActiveDraftSession(null);
        clearActiveDraftSession();
        state.setMessages((prev) => prev.concat({
            id: `cancel-${Date.now()}`,
            role: 'assistant',
            text: 'Draft cancelled.',
            mode: activeDraftSession.intent
        }));
        state.setDraftStatusText('');
        state.setIsDrafting(false);
    } catch {
        state.setDraftStatusText('Failed to cancel draft.');
    } finally {
        state.setIsCancellingDraft(false);
    }
}

export async function resumeDraftSession(
    state: DraftMessagesState,
    activeDraftSession: ActiveDraftSession,
    startStatusPoll: (requestId: string, statusToken: string, onDone: () => void) => void
) {
    state.setActiveDraftSession(activeDraftSession);
    state.setIsDrafting(true);
    state.setDraftStatusText('Reconnecting to draft job...');

    try {
        const job = await getDraftJob(activeDraftSession.requestId, activeDraftSession.statusToken);

        if (job.done) {
            await loadDraftJobResult(state, activeDraftSession.requestId, activeDraftSession.statusToken, activeDraftSession.question, activeDraftSession.intent, job);

            return;
        }

        state.setDraftStatusText(toStatusText(job.stage, job.attempt));
        startStatusPoll(activeDraftSession.requestId, activeDraftSession.statusToken, () => {
            void loadDraftJobResult(state, activeDraftSession.requestId, activeDraftSession.statusToken, activeDraftSession.question, activeDraftSession.intent);
        });
    } catch {
        resetActiveDraftState(state);
    }
}
