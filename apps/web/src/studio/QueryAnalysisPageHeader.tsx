import { QueryAnalysisAiToggle } from './QueryAnalysisAiToggle';
import { QueryAnalysisModeToggle } from './QueryAnalysisModeToggle';
import type { QueryAnalysisMode } from '../api/copilot/useAnalyzeQuery';

interface QueryAnalysisPageHeaderProps {
    analysisMode: QueryAnalysisMode;
    includeAiSummary: boolean;
    isAnalyzing: boolean;
    canAnalyze: boolean;
    summary: Array<{ label: string; value: string }> | null;
    onAnalysisModeChange: (mode: QueryAnalysisMode) => void;
    onAnalyze: () => void;
    onIncludeAiSummaryChange: (enabled: boolean) => void;
}

export function QueryAnalysisPageHeader({
    analysisMode,
    includeAiSummary,
    isAnalyzing,
    canAnalyze,
    summary,
    onAnalysisModeChange,
    onAnalyze,
    onIncludeAiSummaryChange
}: QueryAnalysisPageHeaderProps) {
    return (
        <div className="border-b border-white/6 bg-[#121926] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/70">Dedicated Analysis</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">SQL Query Analyzer</h1>
                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                        Evidence-first analysis workspace for slow-query diagnosis. Findings stay primary; AI advice stays secondary and clearly marked.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <QueryAnalysisModeToggle analysisMode={analysisMode} onAnalysisModeChange={onAnalysisModeChange} />
                    <QueryAnalysisAiToggle enabled={includeAiSummary} onChange={onIncludeAiSummaryChange} />
                    <button
                        type="button"
                        onClick={onAnalyze}
                        disabled={isAnalyzing || !canAnalyze}
                        className="rounded-xl bg-cyan-400 px-5 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        {isAnalyzing ? 'Analyzing' : analysisMode === 'explain_analyze' ? 'Execute Plan' : 'Analyze Query'}
                    </button>
                </div>
            </div>

            {summary && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {summary.map((item) => (
                        <div key={item.label} className="rounded-full border border-white/8 bg-black/20 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
