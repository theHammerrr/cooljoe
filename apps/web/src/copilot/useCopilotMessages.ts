import { useState } from 'react';
import { DraftQueryApiError, useDraftQuery } from '../api/copilot/useDraftQuery';
import { useChat } from '../api/copilot/useChat';
import { isQueryBlock, type CopilotMessage } from './types';

function buildRetryConstraints(issues: string[], previousDraftSql?: string): string {
    const parts = ['Previous draft failed schema validation.', ...issues.map((issue) => `- ${issue}`)];
    if (previousDraftSql) parts.push(`Previous invalid SQL:\n${previousDraftSql}`);
    return parts.join('\n');
}

export function useCopilotMessages() {
    const [messages, setMessages] = useState<CopilotMessage[]>([]);
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const { mutate: draftQuery, isPending: isDrafting } = useDraftQuery();
    const { mutate: sendChat, isPending: isChatting } = useChat();

    const runDraft = (question: string, intent: 'sql' | 'prisma', constraints?: string) => {
        draftQuery({ question, preferred: intent, constraints }, {
            onSuccess: (data: unknown) => {
                setMessages((prev) => prev.concat({
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: "Here's the dataset you requested:",
                    queryBlock: isQueryBlock(data) ? data : undefined,
                    mode: intent
                }));
            },
            onError: (error: unknown) => {
                if (!(error instanceof DraftQueryApiError)) {
                    setMessages((prev) => prev.concat({ id: `err-${Date.now()}`, role: 'assistant', text: "Sorry, I couldn't generate a query." }));
                    return;
                }
                const issues = error.issues || [];
                const draftObj = error.draft;
                const previousDraftSql = typeof draftObj === 'object' && draftObj !== null && typeof Reflect.get(draftObj, 'sql') === 'string'
                    ? String(Reflect.get(draftObj, 'sql'))
                    : undefined;
                setMessages((prev) => prev.concat({
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    text: issues[0] ? `Sorry, I couldn't generate a valid query. ${issues[0]}` : "Sorry, I couldn't generate a query.",
                    mode: intent,
                    retryDraft: { question, mode: intent, constraints: buildRetryConstraints(issues, previousDraftSql) }
                }));
            }
        });
    };

    const handleSend = (text: string, intent: 'chat' | 'sql' | 'prisma') => {
        setMessages((prev) => prev.concat({ id: Date.now().toString(), role: 'user', text, mode: intent }));
        if (intent !== 'chat') return runDraft(text, intent);
        sendChat({ prompt: text }, {
            onSuccess: (data) => setMessages((prev) => prev.concat({ id: (Date.now() + 1).toString(), role: 'assistant', text: data.message })),
            onError: () => setMessages((prev) => prev.concat({ id: 'err', role: 'assistant', text: 'Chat failed.' }))
        });
    };

    return { messages, setMessages, tableResults, setTableResults, runDraft, handleSend, isDrafting, isChatting };
}
