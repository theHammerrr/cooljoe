import type { CopilotMessage } from './types';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAcceptQuery } from '../api/copilot/useAcceptQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { ChatMessageAnswerActions } from './ChatMessageAnswerActions';
import { QueryBlockCard } from './QueryBlockCard';
import { ChatMessageContent } from './chatMessageContent';

interface ChatMessageProps {
    msg: CopilotMessage;
    previousUserMessageText?: string;
    onResults: (rows: Record<string, unknown>[]) => void;
    onUpdateMessage: (id: string, partialMsg: Partial<CopilotMessage>) => void;
    isEmbedded?: boolean;
    onInjectSql?: (sql: string, prisma?: string) => void;
    onRetryDraft?: (retry: NonNullable<CopilotMessage['retryDraft']>) => void;
    onSuggestedDraft?: (draft: NonNullable<CopilotMessage['suggestedDraft']>) => void;
    onNotify?: (message: string, tone?: 'success' | 'error') => void;
}

export function ChatMessage({ msg, previousUserMessageText, onResults, onUpdateMessage, isEmbedded, onInjectSql, onRetryDraft, onSuggestedDraft, onNotify }: ChatMessageProps) {
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: acceptQuery } = useAcceptQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();

    const handleRun = () => {
        if (!msg.queryBlock) return;
        runQuery({ query: msg.queryBlock.sql, mode: 'sql' }, {
            onSuccess: (data) => {
                if (data.success) {
                    onResults(data.rows);
                    onUpdateMessage(msg.id, { requiresApproval: false, tableName: undefined, runError: undefined });
                } else if (data.requiresApproval) {
                    onUpdateMessage(msg.id, { requiresApproval: true, tableName: data.table, runError: undefined });
                } else {
                    onUpdateMessage(msg.id, { runError: data.error || 'Error running query.' });
                }
            },
            onError: (err) => onUpdateMessage(msg.id, { runError: err.message || 'Error running query.' })
        });
    };

    const handleAccept = () => {
        if (!msg.queryBlock || !previousUserMessageText) return;
        acceptQuery({ question: previousUserMessageText, query: msg.queryBlock.sql, prismaQuery: msg.queryBlock.prisma, mode: 'sql' }, {
            onSuccess: (data) => {
                if (data.success) onNotify?.('Query recipe saved.', 'success');
            },
            onError: (err) => onNotify?.(err.message || 'Failed to save query recipe.', 'error')
        });
    };

    const handleAllowAndRun = () => {
        if (!msg.tableName) return;
        allowTable({ table: msg.tableName }, {
            onSuccess: () => {
                onUpdateMessage(msg.id, { requiresApproval: false, tableName: undefined });
                handleRun();
            },
            onError: (err) => onNotify?.(err.message || 'Failed to allow table.', 'error')
        });
    };

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`px-3.5 py-2.5 rounded-xl max-w-[88%] text-sm leading-relaxed overflow-hidden ${
                msg.role === 'user'
                    ? 'bg-slate-700 text-slate-100 rounded-br-none'
                    : 'bg-white/5 border border-white/5 text-slate-300 rounded-bl-none'
            }`}>
                <ChatMessageContent text={msg.text} />
            </div>

            {msg.retryDraft && onRetryDraft && (
                <div className="mt-2 w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 flex items-center justify-between gap-3">
                    <span>Draft failed validation. Retry with stricter context.</span>
                    <button
                        onClick={() => msg.retryDraft && onRetryDraft(msg.retryDraft)}
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-300 px-3 py-1 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors shrink-0"
                    >
                        Try Again
                    </button>
                </div>
            )}

            <ChatMessageAnswerActions message={msg} onInjectSql={onInjectSql} onSuggestedDraft={onSuggestedDraft} />

            {msg.runError && (
                <div className="mt-2 w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
                    {msg.runError}
                </div>
            )}

            <QueryBlockCard msg={msg} isEmbedded={isEmbedded} isRunning={isRunning} isAllowing={isAllowing} onRun={handleRun} onAccept={handleAccept} onInjectSql={onInjectSql} onAllowAndRun={handleAllowAndRun} />
        </div>
    );
}
