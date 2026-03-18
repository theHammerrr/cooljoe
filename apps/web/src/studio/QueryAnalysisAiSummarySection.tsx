import type { QueryAnalysisAiSummary, QueryAnalysisResult } from '../api/copilot/queryAnalysisTypes';
import { QueryAnalysisAiSummaryInputs } from './QueryAnalysisAiSummaryInputs';

interface QueryAnalysisAiSummarySectionProps {
    aiSummary: QueryAnalysisAiSummary | null;
    analysis: QueryAnalysisResult;
}

export function QueryAnalysisAiSummarySection({ aiSummary, analysis }: QueryAnalysisAiSummarySectionProps) {
    return (
        <section className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">AI Optimization Summary</p>
            <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-3 text-sm text-red-100">
                AI may hallucinate, overfit partial evidence, or suggest changes that hurt the broader workload. Validate every recommendation against the actual plan, indexes, schema, and production usage.
            </div>
            {aiSummary ? (
                <>
                    <p className="mt-3 rounded-lg border border-amber-500/20 bg-black/20 px-3 py-2 text-sm text-amber-50">
                        {aiSummary.summary}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-50">
                        {aiSummary.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                    </ul>
                    <p className="mt-3 text-xs text-amber-100/70">{aiSummary.disclaimer}</p>
                    <QueryAnalysisAiSummaryInputs analysis={analysis} />
                </>
            ) : (
                <p className="mt-3 text-sm text-amber-50/80">
                    AI optimization advice is unavailable for this analysis. When enabled, treat it as exploratory guidance only and validate it against the actual plan, indexes, schema, and workload.
                </p>
            )}
        </section>
    );
}
