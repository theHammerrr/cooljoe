import type { ActiveDraftSession } from './activeDraftSession';
import type { CopilotMessage } from './types';

export interface DraftMessagesState {
    stopStatusPoll: () => void;
    setDraftStatusText: (value: string) => void;
    setIsDrafting: (value: boolean) => void;
    setIsCancellingDraft: (value: boolean) => void;
    setMessages: (updater: (prev: CopilotMessage[]) => CopilotMessage[]) => void;
    setActiveDraftSession: (value: ActiveDraftSession | null) => void;
    handleDraftFailure: (question: string, intent: 'sql' | 'prisma', error: unknown) => void;
    tryMarkDraftResultHandled: (requestId: string) => boolean;
    clearHandledDraftResult: (requestId: string) => void;
}
