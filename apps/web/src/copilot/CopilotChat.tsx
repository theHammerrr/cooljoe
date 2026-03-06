import { useRefreshSchema } from '../api/copilot/useRefreshSchema';
import { ChatMessage } from './ChatMessage';
import { ResultsTable } from './ResultsTable';
import { CopilotChatForm } from './CopilotChatForm';
import { useCopilotMessages } from './useCopilotMessages';

interface CopilotChatProps {
    onClose?: () => void;
    isEmbedded?: boolean;
    onInjectSql?: (sql: string, prisma?: string) => void;
}

function ChatHeader({ isEmbedded, isRefreshing, onRefresh, onClose }: { isEmbedded?: boolean; isRefreshing: boolean; onRefresh: () => void; onClose?: () => void }) {
    return (
        <div className="bg-[#161b22] border-b border-white/5 px-4 py-2.5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]"></div>
                <h3 className="font-black text-[11px] text-slate-400 uppercase tracking-widest">
                    {isEmbedded ? 'AI Copilot' : 'DB Copilot'}
                </h3>
            </div>
            <div className="flex gap-1 items-center">
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="text-slate-600 hover:text-slate-300 transition-colors p-1.5 hover:bg-white/5 rounded disabled:opacity-40 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    title="Sync Database Schema"
                >
                    <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRefreshing ? 'Syncing' : 'Sync'}
                </button>
                {onClose && (
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 p-1.5 hover:bg-white/5 rounded transition-colors" title="Close">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export function CopilotChat({ onClose, isEmbedded, onInjectSql }: CopilotChatProps) {
    const { messages, setMessages, tableResults, setTableResults, runDraft, handleSend, isDrafting, isChatting, draftStatusText } = useCopilotMessages();
    const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema();
    const layoutClasses = isEmbedded
        ? 'flex flex-col h-full w-full bg-[#0d1117] overflow-hidden font-sans'
        : 'fixed bottom-4 right-4 w-96 max-h-[80vh] bg-[#161b22] border border-white/10 rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden z-50';

    return (
        <div className={layoutClasses}>
            <ChatHeader isEmbedded={isEmbedded} isRefreshing={isRefreshing} onRefresh={() => refreshSchema()} onClose={onClose} />
            <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-3">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12">
                        <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-violet-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Ask about your data</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <ChatMessage
                        key={msg.id}
                        msg={msg}
                        previousUserMessageText={messages[idx - 1]?.text}
                        onResults={setTableResults}
                        onUpdateMessage={(id, partialMsg) => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, ...partialMsg } : m))}
                        isEmbedded={isEmbedded}
                        onInjectSql={onInjectSql}
                        onRetryDraft={(retry) => runDraft(retry.question, retry.mode, retry.constraints)}
                        onSuggestedDraft={(suggested) => runDraft(suggested.question, suggested.mode)}
                    />
                ))}
                {(isDrafting || isChatting) && (
                    <div className="self-start flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl rounded-bl-none">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[11px] text-slate-500">{isDrafting ? (draftStatusText || 'Thinking...') : 'Thinking...'}</span>
                    </div>
                )}
                {tableResults && <ResultsTable tableResults={tableResults} onClear={() => setTableResults(null)} />}
            </div>
            <div className="px-4 py-3 bg-[#0d1117] border-t border-white/5 shrink-0">
                <CopilotChatForm onSend={handleSend} disabled={isDrafting || isChatting} />
            </div>
        </div>
    );
}
