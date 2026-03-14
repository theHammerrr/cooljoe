interface QueryWorkspaceHeaderProps {
    activeTab: 'sql' | 'prisma';
    onTabChange: (tab: 'sql' | 'prisma') => void;
    onRun: () => void;
    onAnalyze: () => void;
    isRunning: boolean;
    isAnalyzing: boolean;
    canRun: boolean;
    canAnalyze: boolean;
}

export function QueryWorkspaceHeader({ activeTab, onTabChange, onRun, onAnalyze, isRunning, isAnalyzing, canRun, canAnalyze }: QueryWorkspaceHeaderProps) {
    return (
        <div className="bg-[#161b22]/80 backdrop-blur-md border-b border-white/5 p-1.5 flex justify-between items-center px-4 sticky top-0 z-10 shrink-0">
            <div className="flex items-center p-1 bg-black/20 rounded-lg border border-white/5">
                <button 
                    onClick={() => onTabChange('sql')} 
                    className={`px-4 py-1.5 text-[11px] font-bold tracking-tight rounded-md transition-all duration-300 flex items-center gap-2.5 ${
                        activeTab === 'sql' 
                        ? 'bg-white text-slate-900 border border-white/80 shadow-sm' 
                        : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300 hover:bg-slate-800/60'
                    }`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeTab === 'sql' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    SQL
                </button>
                <button 
                    onClick={() => onTabChange('prisma')} 
                    className={`px-4 py-1.5 text-[11px] font-bold tracking-tight rounded-md transition-all duration-300 flex items-center gap-2.5 ${
                        activeTab === 'prisma' 
                        ? 'bg-white text-slate-900 border border-white/80 shadow-sm' 
                        : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300 hover:bg-slate-800/60'
                    }`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeTab === 'prisma' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                    PRISMA
                </button>
            </div>
            
            <div className="flex items-center gap-4">
                {isRunning && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Executing</span>
                    </div>
                )}
                
                <button
                    onClick={onAnalyze}
                    disabled={isAnalyzing || !canAnalyze || activeTab === 'prisma'}
                    className={`group relative px-5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-20 flex items-center gap-2.5 ${
                        activeTab === 'prisma'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-[0_0_20px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.24)]'
                    }`}
                >
                    <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${isAnalyzing ? 'animate-pulse' : 'group-hover:translate-y-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 17l3 3 3-3M12 12v8M5 3h14l-1 6H6L5 3zm1.5 6h11"></path>
                    </svg>
                    <span>{isAnalyzing ? 'Analyzing' : 'Analyze'}</span>
                </button>

                <button 
                    onClick={onRun} 
                    disabled={isRunning || !canRun || activeTab === 'prisma'} 
                    className={`group relative px-5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-20 flex items-center gap-2.5 ${
                        activeTab === 'prisma'
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                    }`}
                >
                    <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${isRunning ? 'animate-pulse' : 'group-hover:translate-x-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <span>{isRunning ? 'Running' : 'Run Query'}</span>
                </button>
            </div>
        </div>
    );
}
