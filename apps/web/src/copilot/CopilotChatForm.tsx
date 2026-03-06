import { useState } from 'react';

interface CopilotChatFormProps {
    onSend: (text: string, intent: 'chat' | 'sql' | 'prisma') => void;
    disabled: boolean;
}

interface ModeOption {
    value: 'chat' | 'sql' | 'prisma';
    label: string;
    color: string;
}

const MODES: ModeOption[] = [
    { value: 'sql', label: 'SQL Draft', color: 'text-emerald-400' },
    { value: 'prisma', label: 'Prisma', color: 'text-violet-400' },
    { value: 'chat', label: 'AI Chat', color: 'text-blue-400' },
];

export function CopilotChatForm({ onSend, disabled }: CopilotChatFormProps) {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'chat' | 'sql' | 'prisma'>('sql');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || disabled) return;
        onSend(input, mode);
        setInput('');
    };

    const currentMode = MODES.find(m => m.value === mode)!;

    return (
        <div className="flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <select
                    value={mode}
                    onChange={(e) => {
                        const nextMode = e.target.value;

                        if (nextMode === 'chat' || nextMode === 'sql' || nextMode === 'prisma') {
                            setMode(nextMode);
                        }
                    }}
                    className={`bg-white/5 border border-white/10 ${currentMode.color} py-2 px-2.5 rounded-lg text-[10px] font-black focus:outline-none focus:border-white/20 uppercase tracking-widest shrink-0 transition-colors`}
                    disabled={disabled}
                >
                    {MODES.map(m => (
                        <option key={m.value} value={m.value} className="text-slate-900 bg-white">{m.label}</option>
                    ))}
                </select>
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
            </form>
            {mode === 'chat' && (
                <p className="text-[10px] text-slate-600 px-1 font-medium">
                    AI Chat is DB-aware. Use SQL/Prisma Draft to generate executable queries.
                </p>
            )}
        </div>
    );
}
