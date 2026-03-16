import { useState } from 'react';
import type { QueryAnalysisAiSummary, QueryAnalysisResult } from '../api/copilot/queryAnalysisTypes';
import { QueryAnalysisAiSummaryInputs } from './QueryAnalysisAiSummaryInputs';

interface QueryAnalysisAiSummarySectionProps {
    aiSummary: QueryAnalysisAiSummary | null;
    analysis: QueryAnalysisResult;
}

export function QueryAnalysisAiSummarySection({ aiSummary, analysis }: QueryAnalysisAiSummarySectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">AI Optimization Summary</p>
                    <p className="mt-2 text-sm text-amber-50/80">Advisory only. Keep deterministic findings and plan inspection primary.</p>
                </div>
                <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setIsExpanded((current) => !current)}
                    className="rounded-lg border border-amber-500/20 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-colors hover:text-white"
                >
                    {isExpanded ? 'Hide AI' : 'Show AI'}
                </button>
            </div>
            <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-3 text-sm text-red-100">
                AI may hallucinate, overfit partial evidence, or suggest changes that hurt the broader workload. Validate every recommendation against the actual plan, indexes, schema, and production usage.
            </div>
            {isExpanded ? aiSummary ? (
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
            ) : (
                <p className="mt-3 text-sm text-amber-50/70">
                    Hidden by default so the page stays centered on evidence-backed findings and the execution plan.
                </p>
            )}
        </section>
    );
}
