import type { CopilotMessage } from './types';

export function pruneStaleDraftFailureMessages(
    prev: CopilotMessage[],
    question: string,
    intent: 'sql' | 'prisma'
): CopilotMessage[] {
    return prev.filter((message) => {
        const retryDraft = message.retryDraft;

        if (retryDraft && retryDraft.question === question && retryDraft.mode === intent) {
            return false;
        }

        if (message.role === 'assistant' && /^Sorry, I couldn't generate/i.test(message.text)) {
            return false;
        }

        return true;
    });
}
