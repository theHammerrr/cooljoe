interface StudioHeaderActionsProps {
    allowlistEnabled: boolean;
    onResetLayout: () => void;
    onOpenAllowlist: () => void;
    onOpenAnalytics: () => void;
}

export function StudioHeaderActions({
    allowlistEnabled,
    onResetLayout,
    onOpenAllowlist,
    onOpenAnalytics
}: StudioHeaderActionsProps) {
    return (
        <div className="flex gap-2">
            <button
                onClick={onResetLayout}
                className="text-[11px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 hover:text-slate-200 transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" /></svg>
                Reset Layout
            </button>
            {allowlistEnabled && (
                <button
                    onClick={onOpenAllowlist}
                    className="text-[11px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 hover:text-slate-200 transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Allowlist
                </button>
            )}
            <button
                onClick={onOpenAnalytics}
                className="text-[11px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 hover:text-slate-200 transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Analytics
            </button>
        </div>
    );
}
