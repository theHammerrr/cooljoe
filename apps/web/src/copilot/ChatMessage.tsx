import type { CopilotMessage } from './types';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAcceptQuery } from '../api/copilot/useAcceptQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { QueryBlockCard } from './QueryBlockCard';

interface ChatMessageProps {
    msg: CopilotMessage;
    previousUserMessageText?: string;
    onResults: (rows: Record<string, unknown>[]) => void;
    onUpdateMessage: (id: string, partialMsg: Partial<CopilotMessage>) => void;
    isEmbedded?: boolean;
    onInjectSql?: (sql: string, prisma?: string) => void;
    onRetryDraft?: (retry: NonNullable<CopilotMessage['retryDraft']>) => void;
    onSuggestedDraft?: (draft: NonNullable<CopilotMessage['suggestedDraft']>) => void;
}

export function ChatMessage({ msg, previousUserMessageText, onResults, onUpdateMessage, isEmbedded, onInjectSql, onRetryDraft, onSuggestedDraft }: ChatMessageProps) {
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
            onSuccess: (data) => { if (data.success) alert('Query Recipe Saved!'); }
        });
    };

    const handleAllowAndRun = () => {
        if (!msg.tableName) return;
        allowTable({ table: msg.tableName }, {
            onSuccess: () => {
                onUpdateMessage(msg.id, { requiresApproval: false, tableName: undefined });
                handleRun();
            },
            onError: (err) => alert(err.message)
        });
    };

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`px-3.5 py-2.5 rounded-xl max-w-[88%] text-sm leading-relaxed ${
                msg.role === 'user'
                    ? 'bg-slate-700 text-slate-100 rounded-br-none'
                    : 'bg-white/5 border border-white/5 text-slate-300 rounded-bl-none'
            }`}>
                {msg.text}
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

            {msg.suggestedDraft && onSuggestedDraft && (
                <div className="mt-2 w-full bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 text-xs text-violet-300 flex items-center justify-between gap-3">
                    <span>{msg.suggestedDraft.reason || 'Generate a draft query from this request.'}</span>
                    <button
                        onClick={() => msg.suggestedDraft && onSuggestedDraft(msg.suggestedDraft)}
                        className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/20 text-violet-300 px-3 py-1 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors shrink-0"
                    >
                        {msg.suggestedDraft.ctaLabel || `Generate ${msg.suggestedDraft.mode.toUpperCase()}`}
                    </button>
                </div>
            )}

            {msg.runError && (
                <div className="mt-2 w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
                    {msg.runError}
                </div>
            )}

            <QueryBlockCard msg={msg} isEmbedded={isEmbedded} isRunning={isRunning} isAllowing={isAllowing} onRun={handleRun} onAccept={handleAccept} onInjectSql={onInjectSql} onAllowAndRun={handleAllowAndRun} />
        </div>
    );
}
