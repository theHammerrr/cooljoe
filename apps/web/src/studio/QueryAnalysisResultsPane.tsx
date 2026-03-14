import type { QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';
import { QueryAnalysisFindingsSection } from './QueryAnalysisFindingsSection';
import { QueryAnalysisSidebar } from './QueryAnalysisSidebar';

interface QueryAnalysisResultsPaneProps {
    analysis: QueryAnalysisResult;
    analysisError: string | null;
    onClear: () => void;
}

export function QueryAnalysisResultsPane({ analysis, analysisError, onClear }: QueryAnalysisResultsPaneProps) {
    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            {analysisError && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                    {analysisError}
                </div>
            )}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/80">Query Analysis</p>
                    <p className="mt-1 text-sm text-slate-300">
                        {analysis.findings.length} finding{analysis.findings.length === 1 ? '' : 's'} across {analysis.referencedTables.length} table{analysis.referencedTables.length === 1 ? '' : 's'} in {analysis.mode === 'explain_analyze' ? 'execution-backed' : 'planner-only'} mode.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-200"
                >
                    Clear
                </button>
            </div>
            {analysis.safetyNotes.map((note) => (
                <div key={note} className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    {note}
                </div>
            ))}

            <div className="grid min-h-0 flex-1 gap-4 overflow-auto xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
                <div className="space-y-4">
                    <QueryAnalysisFindingsSection findings={analysis.findings} />
                    <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Normalized SQL</p>
                        <pre className="mt-3 overflow-auto rounded-lg border border-white/5 bg-black/30 p-3 text-xs text-slate-300">
                            <code>{analysis.normalizedSql}</code>
                        </pre>
                    </section>
                </div>
                <QueryAnalysisSidebar analysis={analysis} />
            </div>
        </div>
    );
}
