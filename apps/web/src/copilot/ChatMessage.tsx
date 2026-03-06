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
}

export function ChatMessage({ msg, previousUserMessageText, onResults, onUpdateMessage, isEmbedded, onInjectSql, onRetryDraft }: ChatMessageProps) {
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: acceptQuery } = useAcceptQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();

    const handleRun = () => {
        if (!msg.queryBlock) return;
        runQuery({ query: msg.queryBlock.sql, mode: 'sql' }, {
            onSuccess: (data) => {
                if (data.success) {
                    onResults(data.rows);
                    onUpdateMessage(msg.id, { requiresApproval: false, tableName: undefined });
                } else if (data.requiresApproval) {
                    onUpdateMessage(msg.id, { requiresApproval: true, tableName: data.table });
                } else {
                    alert(`Error running query: ${data.error}`);
                }
            },
            onError: (err) => alert(`Error running query: ${err.message}`)
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
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                {msg.text}
            </div>
            {msg.retryDraft && onRetryDraft && (
                <div className="mt-2 w-full bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-center justify-between gap-3">
                    <span>Draft failed validation. Retry with stricter context.</span>
                    <button onClick={() => msg.retryDraft && onRetryDraft(msg.retryDraft)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium transition-colors cursor-pointer">Try Again</button>
                </div>
            )}
            <QueryBlockCard msg={msg} isEmbedded={isEmbedded} isRunning={isRunning} isAllowing={isAllowing} onRun={handleRun} onAccept={handleAccept} onInjectSql={onInjectSql} onAllowAndRun={handleAllowAndRun} />
        </div>
    );
}
