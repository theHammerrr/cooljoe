import type { ChatNotice } from './types';

interface ChatHeaderProps {
    isEmbedded?: boolean;
    onClear: () => void;
    onNewTopic: () => void;
    onClose?: () => void;
}

interface ChatNoticeBannerProps {
    notice: ChatNotice;
    onDismiss: () => void;
}

export function ChatNoticeBanner({ notice, onDismiss }: ChatNoticeBannerProps) {
    const toneClasses = notice.tone === 'error'
        ? 'bg-red-500/10 border-red-500/20 text-red-200'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200';

    return (
        <div className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-3 ${toneClasses}`}>
            <span>{notice.message}</span>
            <button onClick={onDismiss} className="text-[10px] font-bold uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                Dismiss
            </button>
        </div>
    );
}

export function ChatHeader({ isEmbedded, onClear, onNewTopic, onClose }: ChatHeaderProps) {
    return (
        <div className="bg-[#161b22] border-b border-white/5 px-4 py-2.5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]"></div>
                <div className="flex flex-col">
                    <h3 className="font-black text-[11px] text-slate-400 uppercase tracking-widest">
                        {isEmbedded ? 'AI Copilot' : 'DB Copilot'}
                    </h3>
                    <span className="text-[9px] text-slate-600 font-medium">Focused context with structured memory. Start a new topic when switching tasks.</span>
                </div>
            </div>
            <div className="flex gap-1 items-center">
                <button
                    onClick={onNewTopic}
                    className="text-slate-600 hover:text-slate-300 transition-colors p-1.5 hover:bg-white/5 rounded flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    title="Start a New Topic"
                >
                    New Topic
                </button>
                <button
                    onClick={onClear}
                    className="text-slate-600 hover:text-slate-300 transition-colors p-1.5 hover:bg-white/5 rounded flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    title="Clear Copilot Chat"
                >
                    Clear
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

export function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12">
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </div>
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Ask about your data</p>
        </div>
    );
}

interface ChatActivityProps {
    isDrafting: boolean;
    isChatting: boolean;
    draftStatusText: string;
}

export function ChatActivity({ isDrafting, isChatting, draftStatusText }: ChatActivityProps) {
    if (!isDrafting && !isChatting) return null;

    return (
        <div className="self-start flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl rounded-bl-none">
            <div className="flex gap-1">
                <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"></span>
            </div>
            <span className="text-[11px] text-slate-500">{isDrafting ? (draftStatusText || 'Thinking...') : 'Thinking...'}</span>
        </div>
    );
}
