import { useEffect, useRef, useState } from 'react';
import { DraftQueryApiError, issueDraftQueryToken, useDraftQuery } from '../api/copilot/useDraftQuery';
import { useChat } from '../api/copilot/useChat';
import { isQueryBlock, type CopilotMessage } from './types';
import { startDraftStatusPolling } from './draftStatus';
import { formatDraftFailureMessage } from './draftErrorMessages';

function buildRetryConstraints(issues: string[], previousDraftSql?: string): string {
    const parts = ['Previous draft failed schema validation.', ...issues.map((issue) => `- ${issue}`)];

    if (previousDraftSql) parts.push(`Previous invalid SQL:\n${previousDraftSql}`);

    return parts.join('\n');
}

function buildRecentTurns(messages: CopilotMessage[], nextUserText: string) {
    const base = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-5)
        .map((m) => ({ role: m.role, text: m.text }));

    return base.concat({ role: 'user', text: nextUserText });
}

export function useCopilotMessages() {
    const [messages, setMessages] = useState<CopilotMessage[]>([]);
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [draftStatusText, setDraftStatusText] = useState<string>('');
    const { mutate: draftQuery, isPending: isDrafting } = useDraftQuery();
    const { mutate: sendChat, isPending: isChatting } = useChat();
    const statusPollRef = useRef<(() => void) | null>(null);

    const stopStatusPoll = () => {
        if (statusPollRef.current !== null) {
            statusPollRef.current();
            statusPollRef.current = null;
        }
    };

    useEffect(() => () => stopStatusPoll(), []);

    const startStatusPoll = (requestId: string, statusToken: string) => {
        stopStatusPoll();
        statusPollRef.current = startDraftStatusPolling(requestId, statusToken, setDraftStatusText);
    };

    const runDraft = async (question: string, intent: 'sql' | 'prisma', constraints?: string) => {
        let draftToken: { requestId: string; statusToken: string };

        try {
            draftToken = await issueDraftQueryToken();
        } catch {
            setMessages((prev) => prev.concat({ id: `err-${Date.now()}`, role: 'assistant', text: "Sorry, I couldn't generate a query." }));

            return;
        }

        startStatusPoll(draftToken.requestId, draftToken.statusToken);
        draftQuery({ question, preferred: intent, constraints, requestId: draftToken.requestId, statusToken: draftToken.statusToken }, {
            onSuccess: (data: unknown) => {
                stopStatusPoll();
                setDraftStatusText('');
                setMessages((prev) => prev.concat({
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: "Here's the dataset you requested:",
                    queryBlock: isQueryBlock(data) ? data : undefined,
                    mode: intent
                }));
            },
            onError: (error: unknown) => {
                stopStatusPoll();
                setDraftStatusText('');

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
                    text: issues[0]
                        ? `Sorry, I couldn't generate a valid query. ${formatDraftFailureMessage(issues[0])}`
                        : "Sorry, I couldn't generate a query.",
                    mode: intent,
                    retryDraft: { question, mode: intent, constraints: buildRetryConstraints(issues, previousDraftSql) }
                }));
            }
        });
    };

    const handleSend = (text: string, intent: 'chat' | 'sql' | 'prisma') => {
        setMessages((prev) => prev.concat({ id: Date.now().toString(), role: 'user', text, mode: intent }));

        if (intent !== 'chat') {
            void runDraft(text, intent);

            return;
        }
        sendChat({ prompt: text, context: { recentTurns: buildRecentTurns(messages, text) } }, {
            onSuccess: (data) => setMessages((prev) => prev.concat({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: data.message,
                mode: 'chat',
                suggestedDraft: data.suggestedDraft || undefined
            })),
            onError: () => setMessages((prev) => prev.concat({ id: `err-${Date.now()}`, role: 'assistant', text: 'Chat failed.' }))
        });
    };

    return { messages, setMessages, tableResults, setTableResults, runDraft, handleSend, isDrafting, isChatting, draftStatusText };
}
