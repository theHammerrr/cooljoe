import { loadActiveDraftSession } from './activeDraftSession';
import { loadConversationTranscript } from './conversationTranscript';
import { appendRecoveredQuestionMessage } from './useCopilotMessagesHelpers';

export function loadInitialCopilotMessages() {
    const activeDraftSession = loadActiveDraftSession();
    const transcript = loadConversationTranscript();
    const messages = activeDraftSession
        ? appendRecoveredQuestionMessage(transcript, activeDraftSession.question, activeDraftSession.intent)
        : transcript;

    return {
        activeDraftSession,
        messages
    };
}
