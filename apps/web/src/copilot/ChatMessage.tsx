/* eslint-disable max-lines */
import type { CopilotMessage } from './types';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAcceptQuery } from '../api/copilot/useAcceptQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';

interface ChatMessageProps {
    msg: CopilotMessage;
    previousUserMessageText?: string;
    onResults: (rows: Record<string, unknown>[]) => void;
    onUpdateMessage: (id: string, partialMsg: Partial<CopilotMessage>) => void;
}

export function ChatMessage({ msg, previousUserMessageText, onResults, onUpdateMessage }: ChatMessageProps) {
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: acceptQuery } = useAcceptQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();

    const handleRun = () => {
        if (!msg.queryBlock) return;
        runQuery({ query: msg.queryBlock.sql, mode: 'sql' }, {
            onSuccess: (data) => {
                if (data.success) {
                    onResults(data.rows);
                    onUpdateMessage(msg.id, { requiresApproval: false, tableName: undefined }); // Clear any stale approval block
                } else if (data.requiresApproval) {
                    onUpdateMessage(msg.id, { requiresApproval: true, tableName: data.table });
                } else {
                    alert("Error running query: " + data.error);
                }
            },
            onError: (err) => {
                alert("Error running query: " + err.message);
            }
        });
    };

    const handleAccept = () => {
        if (!msg.queryBlock || !previousUserMessageText) return;
        acceptQuery({
            question: previousUserMessageText,
            query: msg.queryBlock.sql,
            prismaQuery: msg.queryBlock.prisma,
            mode: 'sql'
        }, {
            onSuccess: (data) => {
                if (data.success) alert("Query Recipe Saved!");
            }
        });
    };

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                {msg.text}
            </div>

            {msg.queryBlock && (
                <div className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-inner text-xs">
                    <div className="p-2 border-b border-slate-700 font-semibold text-slate-300 flex justify-between">
                        <span>SQL Draft: {msg.queryBlock.intent}</span>
                    </div>
                    <pre className="p-3 text-green-400 whitespace-pre-wrap font-mono overflow-x-auto">
                        {msg.queryBlock.sql}
                    </pre>
                    
                    {msg.queryBlock.riskFlags.length > 0 && (
                        <div className="p-2 bg-yellow-900/50 text-yellow-300 border-t border-slate-700">
                            ⚠️ {msg.queryBlock.riskFlags.join(", ")}
                        </div>
                    )}

                    {msg.requiresApproval && msg.tableName && (
                        <div className="p-3 bg-red-900/30 text-red-200 border-t border-slate-700 flex flex-col gap-2">
                            <span className="font-semibold">⚠️ Table "{msg.tableName}" is not allowed.</span>
                            <button 
                                onClick={() => {
                                    const tableName = msg.tableName;
                                    if (!tableName) return;
                                    allowTable({ table: tableName }, {
                                        onSuccess: () => {
                                            onUpdateMessage(msg.id, { requiresApproval: false, tableName: undefined });
                                            handleRun(); // Auto re-run upon completion
                                        },
                                        onError: (err) => alert(err.message)
                                    });
                                }}
                                disabled={isAllowing}
                                className="bg-red-600 hover:bg-red-500 text-white py-1 px-3 w-fit rounded cursor-pointer disabled:opacity-50"
                            >
                                {isAllowing ? "Allowing..." : "Allow & Run"}
                            </button>
                        </div>
                    )}

                    <div className="bg-slate-800 p-2 flex gap-2 border-t border-slate-700">
                        <button 
                            onClick={handleRun}
                            disabled={isRunning}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isRunning ? 'Running...' : 'Run Query'}
                        </button>
                        <button 
                            onClick={handleAccept}
                            className="bg-slate-600 hover:bg-slate-500 text-slate-200 py-1.5 px-3 rounded font-medium transition-colors cursor-pointer"
                            title="Accept & Save Recipe"
                        >
                            👍 Accept
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
