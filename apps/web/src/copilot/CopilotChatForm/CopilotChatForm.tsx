import { useEffect, useState } from 'react';
import { loadComposeState, saveComposeState, type ComposeMode } from '../composeState';
import { CopilotChatModeSelect } from '../CopilotChatModeSelect';
import { getGetHelperText } from './getGetHelperText';

interface CopilotChatFormProps {
    onSend: (text: string, intent: ComposeMode) => void;
    onCancelDraft?: () => void;
    disabled: boolean;
    showCancelDraft?: boolean;
    isCancellingDraft?: boolean;
}

export function CopilotChatForm({
    onSend,
    onCancelDraft,
    disabled,
    showCancelDraft = false,
    isCancellingDraft = false
}: CopilotChatFormProps) {
    const initialComposeState = loadComposeState();
    const [input, setInput] = useState(initialComposeState.input);
    const [mode, setMode] = useState<ComposeMode>(initialComposeState.mode);

    useEffect(() => {
        saveComposeState(input, mode);
    }, [input, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || disabled) return;
        onSend(input, mode);
        setInput('');
    };

    return (
        <div className="flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <CopilotChatModeSelect disabled={disabled} mode={mode} onChange={setMode} />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your data..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20 focus:bg-white/8 transition-all text-slate-300 placeholder-slate-600 min-w-0"
                    disabled={disabled}
                />
                <button
                    type="submit"
                    disabled={disabled || !input.trim()}
                    className="bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 p-2 rounded-lg w-9 h-9 flex items-center justify-center disabled:opacity-30 transition-all shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
                {showCancelDraft && onCancelDraft && (
                    <button
                        type="button"
                        onClick={onCancelDraft}
                        disabled={isCancellingDraft}
                        className="border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 shrink-0"
                    >
                        {isCancellingDraft ? 'Cancelling' : 'Cancel Draft'}
                    </button>
                )}
            </form>
            <p className="text-[12px] text-slate-600 px-1 font-medium">
                {getGetHelperText(mode)}
            </p>
        </div>
    );
}
