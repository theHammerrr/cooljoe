interface ModeOption {
    value: 'chat' | 'sql' | 'prisma';
    label: string;
    color: string;
}

const MODES: ModeOption[] = [
    { value: 'chat', label: 'AI Chat', color: 'text-sky-300' },
    { value: 'sql', label: 'SQL Draft', color: 'text-emerald-400' },
    { value: 'prisma', label: 'Prisma', color: 'text-violet-400' },
];

interface CopilotChatModeSelectProps {
    disabled: boolean;
    mode: 'chat' | 'sql' | 'prisma';
    onChange: (mode: 'chat' | 'sql' | 'prisma') => void;
}

export function CopilotChatModeSelect({ disabled, mode, onChange }: CopilotChatModeSelectProps) {
    const currentMode = MODES.find((item) => item.value === mode) || MODES[0];

    return (
        <div className="relative shrink-0">
            <select
                value={mode}
                onChange={(e) => {
                    const nextMode = e.target.value;

                    if (nextMode === 'chat' || nextMode === 'sql' || nextMode === 'prisma') {
                        onChange(nextMode);
                    }
                }}
                className={`appearance-none bg-[#11161d] border border-white/10 ${currentMode.color} py-2 pl-3 pr-9 rounded-lg text-[10px] font-black focus:outline-none focus:border-white/20 focus:bg-[#171d25] uppercase tracking-widest shrink-0 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`}
                disabled={disabled}
            >
                {MODES.map((item) => (
                    <option key={item.value} value={item.value} className="bg-[#0d1117] text-slate-200">
                        {item.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m6 9 6 6 6-6" />
                </svg>
            </div>
        </div>
    );
}
