import { QueryWorkspaceTabSwitch } from './QueryWorkspaceTabSwitch';

interface QueryWorkspaceHeaderProps {
    activeTab: 'sql' | 'prisma';
    onTabChange: (tab: 'sql' | 'prisma') => void;
    onRun: () => void;
    isRunning: boolean;
    canRun: boolean;
}

export function QueryWorkspaceHeader({
    activeTab,
    onTabChange,
    onRun,
    isRunning,
    canRun
}: QueryWorkspaceHeaderProps) {
    return (
        <div className="bg-[#161b22]/80 backdrop-blur-md border-b border-white/5 p-1.5 flex justify-between items-center px-4 sticky top-0 z-10 shrink-0">
            <QueryWorkspaceTabSwitch activeTab={activeTab} onTabChange={onTabChange} />
            
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
