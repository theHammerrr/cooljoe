interface QueryWorkspaceEmptyStateProps {
    activeTab: 'sql' | 'prisma';
}

export function QueryWorkspaceEmptyState({ activeTab }: QueryWorkspaceEmptyStateProps) {
    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-600 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                <div className="relative p-6 rounded-3xl bg-[#161b22] border border-white/5 shadow-2xl">
                    <svg className="w-10 h-10 text-emerald-500/30 group-hover:text-emerald-500/50 transition-colors duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {activeTab === 'sql' ? "Terminal Ready" : "Code Generated"}
                </h3>
                <p className="text-xs text-slate-600 max-w-[280px] leading-relaxed">
                    {activeTab === 'sql' 
                        ? "Run your SQL query above to inspect live data from the database." 
                        : "Prisma Client code is ready to be integrated into your application."}
                </p>
            </div>
        </div>
    );
}
