import type { QueryAnalysisMode } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisModeToggleProps {
    analysisMode: QueryAnalysisMode;
    onAnalysisModeChange: (mode: QueryAnalysisMode) => void;
}

export function QueryAnalysisModeToggle({ analysisMode, onAnalysisModeChange }: QueryAnalysisModeToggleProps) {
    return (
        <div className="hidden items-center gap-1 rounded-lg border border-white/5 bg-black/20 p-1 md:flex">
            <button
                type="button"
                onClick={() => onAnalysisModeChange('explain')}
                className={`rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    analysisMode === 'explain'
                        ? 'bg-cyan-400 text-cyan-950'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
            >
                Plan Only
            </button>
            <button
                type="button"
                onClick={() => onAnalysisModeChange('explain_analyze')}
                className={`rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    analysisMode === 'explain_analyze'
                        ? 'bg-amber-400 text-amber-950'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
            >
                Run Analyze
            </button>
        </div>
    );
}
