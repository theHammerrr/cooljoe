/* eslint-disable max-lines */
import { useState } from 'react';
import { isQueryBlock, type CopilotMessage } from './types';
import { useDraftQuery } from '../api/copilot/useDraftQuery';
import { useChat } from '../api/copilot/useChat';
import { useRefreshSchema } from '../api/copilot/useRefreshSchema';
import { ChatMessage } from './ChatMessage';
import { ResultsTable } from './ResultsTable';
import { CopilotChatForm } from './CopilotChatForm';

interface CopilotChatProps {
    onClose?: () => void;
}

export function CopilotChat({ onClose }: CopilotChatProps) {
    const [messages, setMessages] = useState<CopilotMessage[]>([]);
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);

    const { mutate: draftQuery, isPending: isDrafting } = useDraftQuery();
    const { mutate: sendChat, isPending: isChatting } = useChat();
    const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema();

    const handleSend = (text: string, intent: 'chat' | 'sql') => {
        const userMsg: CopilotMessage = { id: Date.now().toString(), role: 'user', text };
        setMessages((prev) => [...prev, userMsg]);

        if (intent === 'chat') {
            sendChat({ prompt: text }, {
                onSuccess: (data) => {
                    setMessages((prev) => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        text: data.message
                    }]);
                },
                onError: () => {
                   setMessages((prev) => [...prev, { id: 'err', role: 'assistant', text: "Chat failed." }]);
                }
            });
        } else {
            draftQuery({ question: text }, {
                onSuccess: (data: unknown) => {
                    const queryBlock = isQueryBlock(data) ? data : undefined;
                    const aiMsg: CopilotMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        text: "Here's the dataset you requested:",
                        queryBlock
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                },
                onError: () => {
                    setMessages((prev) => [...prev, { id: 'err', role: 'assistant', text: "Sorry, I couldn't generate a query." }]);
                }
            });
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden z-50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
                <h3 className="font-bold text-lg tracking-wide">DB Copilot</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => refreshSchema()} 
                        disabled={isRefreshing}
                        className="hover:bg-white/20 px-2 py-1 rounded text-sm transition-colors tabular-nums disabled:opacity-50"
                        title="Sync Database Schema Constraints"
                    >
                        {isRefreshing ? '🔄 Syncing...' : '🔄 Sync DB'}
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="hover:bg-white/20 px-2 py-1 rounded transition-colors text-lg" title="Close">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="text-gray-400 text-sm text-center mt-10 italic">
                        Ask a question about your data...
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <ChatMessage 
                        key={msg.id} 
                        msg={msg} 
                        previousUserMessageText={messages[idx - 1]?.text}
                        onResults={setTableResults}
                        onUpdateMessage={(id, partialMsg) => setMessages(prev => prev.map(m => m.id === id ? { ...m, ...partialMsg } : m))}
                    />
                ))}

                { (isDrafting || isChatting) && (
                    <div className="self-start px-4 py-2 bg-white text-gray-500 rounded-2xl shadow-sm border border-gray-100 rounded-bl-none animate-pulse">
                        Thinking...
                    </div>
                )}

                {tableResults && (
                    <ResultsTable 
                        tableResults={tableResults} 
                        onClear={() => setTableResults(null)} 
                    />
                )}
            </div>

            <div className="p-3 bg-white border-t border-gray-100">
                <CopilotChatForm onSend={handleSend} disabled={isDrafting || isChatting} />
            </div>
        </div>
    );
}
