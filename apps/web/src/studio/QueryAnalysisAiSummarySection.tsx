import type { QueryAnalysisAiSummary } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisAiSummarySectionProps {
    aiSummary: QueryAnalysisAiSummary | null;
}

export function QueryAnalysisAiSummarySection({ aiSummary }: QueryAnalysisAiSummarySectionProps) {
    return (
        <section className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">AI Summary</p>
            {aiSummary ? (
                <>
                    <p className="mt-3 rounded-lg border border-amber-500/20 bg-black/20 px-3 py-2 text-sm text-amber-50">
                        {aiSummary.summary}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-50">
                        {aiSummary.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                    </ul>
                    <p className="mt-3 text-xs text-amber-100/70">{aiSummary.disclaimer}</p>
                </>
            ) : (
                <p className="mt-3 text-sm text-amber-50/80">
                    AI summary is unavailable for this analysis. When enabled, it should be treated as advisory only and validated against the actual plan and findings.
                </p>
            )}
        </section>
    );
}
