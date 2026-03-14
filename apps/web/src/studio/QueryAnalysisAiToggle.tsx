interface QueryAnalysisAiToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

export function QueryAnalysisAiToggle({ enabled, onChange }: QueryAnalysisAiToggleProps) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                enabled
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
        >
            {enabled ? 'AI Summary On' : 'AI Summary Off'}
        </button>
    );
}
