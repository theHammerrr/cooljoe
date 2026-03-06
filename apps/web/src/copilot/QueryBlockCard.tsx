import type { CopilotMessage } from './types';

interface QueryBlockCardProps {
    msg: CopilotMessage;
    isEmbedded?: boolean;
    isRunning: boolean;
    isAllowing: boolean;
    onRun: () => void;
    onAccept: () => void;
    onInjectSql?: (sql: string, prisma?: string) => void;
    onAllowAndRun: () => void;
}

export function QueryBlockCard({ msg, isEmbedded, isRunning, isAllowing, onRun, onAccept, onInjectSql, onAllowAndRun }: QueryBlockCardProps) {
    if (!msg.queryBlock) return null;

    return (
        <div className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-inner text-xs">
            <div className="p-2 border-b border-slate-700 font-semibold text-slate-300 flex justify-between">
                <span>{msg.mode === 'prisma' ? 'Prisma Draft' : 'SQL Draft'}: {msg.queryBlock.intent}</span>
            </div>
            <pre className={`p-3 whitespace-pre-wrap font-mono overflow-x-auto ${msg.mode === 'prisma' ? 'text-purple-400' : 'text-green-400'}`}>
                {msg.mode === 'prisma' && msg.queryBlock.prisma ? msg.queryBlock.prisma : msg.queryBlock.sql}
            </pre>
            {msg.queryBlock.riskFlags.length > 0 && <div className="p-2 bg-yellow-900/50 text-yellow-300 border-t border-slate-700">{msg.queryBlock.riskFlags.join(', ')}</div>}
            {msg.requiresApproval && msg.tableName && (
                <div className="p-3 bg-red-900/30 text-red-200 border-t border-slate-700 flex flex-col gap-2">
                    <span className="font-semibold">Table "{msg.tableName}" is not allowed.</span>
                    <button onClick={onAllowAndRun} disabled={isAllowing} className="bg-red-600 hover:bg-red-500 text-white py-1 px-3 w-fit rounded cursor-pointer disabled:opacity-50">
                        {isAllowing ? 'Allowing...' : 'Allow & Run'}
                    </button>
                </div>
            )}
            <div className="bg-slate-800 p-2 flex gap-2 border-t border-slate-700">
                {msg.mode === 'prisma' ? (
                    <button onClick={() => navigator.clipboard.writeText(msg.queryBlock!.prisma || '')} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-1.5 px-3 rounded font-medium transition-colors cursor-pointer" title="Copy Prisma Javascript snippet">Copy Code</button>
                ) : isEmbedded && onInjectSql ? (
                    <button onClick={() => onInjectSql(msg.queryBlock!.sql)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-3 rounded font-medium transition-colors cursor-pointer" title="Send SQL to Workspace Editor">Inject to Editor</button>
                ) : (
                    <button onClick={onRun} disabled={isRunning} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded font-medium transition-colors cursor-pointer disabled:opacity-50">{isRunning ? 'Running...' : 'Run Query'}</button>
                )}
                <button onClick={onAccept} className="bg-slate-600 hover:bg-slate-500 text-slate-200 py-1.5 px-3 rounded font-medium transition-colors cursor-pointer" title="Accept & Save Recipe">Accept</button>
            </div>
        </div>
    );
}
