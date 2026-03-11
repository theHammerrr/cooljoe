import { ChatMessage } from './ChatMessage';
import { ResultsTable } from './ResultsTable';
import { CopilotChatForm } from './CopilotChatForm';
import { ChatActivity, ChatHeader, ChatNoticeBanner, EmptyState } from './CopilotChatChrome';
import { useCopilotMessages } from './useCopilotMessages';

interface CopilotChatProps {
    onClose?: () => void;
    isEmbedded?: boolean;
    onInjectSql?: (sql: string, prisma?: string) => void;
}

export function CopilotChat({ onClose, isEmbedded, onInjectSql }: CopilotChatProps) {
    const {
        messages,
        setMessages,
        tableResults,
        setTableResults,
        runDraft,
        handleSend,
        cancelCurrentDraft,
        clearChat,
        startNewTopic,
        isDrafting,
        isCancellingDraft,
        isChatting,
        draftStatusText,
        notice,
        showNotice,
        dismissNotice
    } = useCopilotMessages();
    const layoutClasses = isEmbedded
        ? 'flex flex-col h-full w-full bg-[#0d1117] overflow-hidden font-sans'
        : 'fixed bottom-4 right-4 w-96 max-h-[80vh] bg-[#161b22] border border-white/10 rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden z-50';

    return (
        <div className={layoutClasses}>
            <ChatHeader isEmbedded={isEmbedded} onClear={() => void clearChat()} onNewTopic={() => void startNewTopic()} onClose={onClose} />
            {notice && <ChatNoticeBanner notice={notice} onDismiss={dismissNotice} />}
            <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-3">
                {messages.length === 0 && <EmptyState />}
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
                        onSuggestedDraft={(suggested) => runDraft(suggested.question, suggested.mode, suggested.constraints)}
                        onNotify={showNotice}
                    />
                ))}
                <ChatActivity isDrafting={isDrafting} isChatting={isChatting} draftStatusText={draftStatusText} />
                {tableResults && <ResultsTable tableResults={tableResults} onClear={() => setTableResults(null)} />}
            </div>
            <div className="px-4 py-3 bg-[#0d1117] border-t border-white/5 shrink-0">
                <CopilotChatForm
                    onSend={handleSend}
                    onCancelDraft={cancelCurrentDraft}
                    disabled={isDrafting || isChatting}
                    showCancelDraft={isDrafting}
                    isCancellingDraft={isCancellingDraft}
                />
            </div>
        </div>
    );
}
