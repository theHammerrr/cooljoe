import { clearActiveDraftSession } from './activeDraftSession';
import { clearComposeState } from './composeState';
import { clearConversationTranscript } from './conversationTranscript';
import { clearConversationTopicId } from './conversationTopic';
import { clearWorkspaceSnapshot } from './workspaceSnapshot';

export function clearPersistedCopilotState() {
    clearActiveDraftSession();
    clearConversationTranscript();
    clearConversationTopicId();
    clearWorkspaceSnapshot();
    clearComposeState();
}
