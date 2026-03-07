import { clearActiveDraftSession } from './activeDraftSession';
import { clearComposeState } from './composeState';
import { clearConversationTranscript } from './conversationTranscript';
import { clearWorkspaceSnapshot } from './workspaceSnapshot';

export function clearPersistedCopilotState() {
    clearActiveDraftSession();
    clearConversationTranscript();
    clearWorkspaceSnapshot();
    clearComposeState();
}
