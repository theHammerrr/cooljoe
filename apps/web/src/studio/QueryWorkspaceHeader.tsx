import { QueryAnalysisModeToggle } from './QueryAnalysisModeToggle';
import { QueryAnalysisAiToggle } from './QueryAnalysisAiToggle';
import { QueryWorkspaceTabSwitch } from './QueryWorkspaceTabSwitch';

interface QueryWorkspaceHeaderProps {
    activeTab: 'sql' | 'prisma';
    analysisMode: 'explain' | 'explain_analyze';
    includeAiSummary: boolean;
    onTabChange: (tab: 'sql' | 'prisma') => void;
    onAnalysisModeChange: (mode: 'explain' | 'explain_analyze') => void;
    onIncludeAiSummaryChange: (enabled: boolean) => void;
    onRun: () => void;
    onAnalyze: () => void;
    isRunning: boolean;
    isAnalyzing: boolean;
    canRun: boolean;
    canAnalyze: boolean;
}

export function QueryWorkspaceHeader({
    activeTab,
    analysisMode,
    includeAiSummary,
    onTabChange,
    onAnalysisModeChange,
    onIncludeAiSummaryChange,
    onRun,
    onAnalyze,
    isRunning,
    isAnalyzing,
    canRun,
    canAnalyze
}: QueryWorkspaceHeaderProps) {
    return (
        <div className="bg-[#161b22]/80 backdrop-blur-md border-b border-white/5 p-1.5 flex justify-between items-center px-4 sticky top-0 z-10 shrink-0">
            <QueryWorkspaceTabSwitch activeTab={activeTab} onTabChange={onTabChange} />
            
            <div className="flex items-center gap-4">
                <QueryAnalysisModeToggle analysisMode={analysisMode} onAnalysisModeChange={onAnalysisModeChange} />
                <QueryAnalysisAiToggle enabled={includeAiSummary} onChange={onIncludeAiSummaryChange} />

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
                            : analysisMode === 'explain_analyze'
                                ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.18)] hover:shadow-[0_0_25px_rgba(251,191,36,0.24)]'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-[0_0_20px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.24)]'
                    }`}
                >
                    <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${isAnalyzing ? 'animate-pulse' : 'group-hover:translate-y-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 17l3 3 3-3M12 12v8M5 3h14l-1 6H6L5 3zm1.5 6h11"></path>
                    </svg>
                    <span>{isAnalyzing ? 'Analyzing' : analysisMode === 'explain_analyze' ? 'Run Analyze' : 'Analyze'}</span>
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
