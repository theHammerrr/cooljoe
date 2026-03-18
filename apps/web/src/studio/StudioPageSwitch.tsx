interface StudioPageSwitchProps {
    activePage: 'workspace' | 'analysis';
    onPageChange: (page: 'workspace' | 'analysis') => void;
}

export function StudioPageSwitch({ activePage, onPageChange }: StudioPageSwitchProps) {
    return (
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-black/20 p-1">
            <button
                type="button"
                onClick={() => onPageChange('workspace')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] transition-colors ${
                    activePage === 'workspace'
                        ? 'bg-emerald-500 text-emerald-950'
                        : 'text-slate-400 hover:text-slate-100'
                }`}
            >
                Workspace
            </button>
            <button
                type="button"
                onClick={() => onPageChange('analysis')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] transition-colors ${
                    activePage === 'analysis'
                        ? 'bg-cyan-400 text-cyan-950'
                        : 'text-slate-400 hover:text-slate-100'
                }`}
            >
                Analyze
            </button>
        </div>
    );
}
