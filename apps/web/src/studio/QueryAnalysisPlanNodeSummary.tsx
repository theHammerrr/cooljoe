import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';
import { QueryAnalysisPlanMetricsGrid } from './QueryAnalysisPlanMetricsGrid';
import { getPlanNodeNarrative } from './queryAnalysisPlanNarrative';
import { getPlanPressure, getPlanPressureClassName, getPlanPressureLabel } from './queryAnalysisPlanPressure';

interface QueryAnalysisPlanNodeSummaryProps {
    node: QueryAnalysisPlanNode;
}

export function QueryAnalysisPlanNodeSummary({ node }: QueryAnalysisPlanNodeSummaryProps) {
    const narrative = getPlanNodeNarrative(node);
    const pressure = getPlanPressure(node);

    return (
        <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Selected Plan Node</p>
                    <h3 className="mt-3 text-lg font-semibold text-white">{narrative.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{narrative.summary}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getPlanPressureClassName(pressure)}`}>
                    {getPlanPressureLabel(pressure)}
                </span>
            </div>

            <div className="mt-4 rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">SQL Mapping</p>
                <p className="mt-2 text-sm text-cyan-50">{narrative.sqlReference}</p>
                {node.sqlReferences.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {node.sqlReferences.map((reference) => (
                            <code key={reference} className="block overflow-x-auto rounded-lg bg-black/25 px-3 py-2 text-xs text-cyan-50/90">
                                {reference}
                            </code>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 rounded-xl border border-white/6 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">What To Look At Next</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {narrative.watchItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
            </div>

            <div className="mt-4">
                <QueryAnalysisPlanMetricsGrid node={node} />
            </div>
        </section>
    );
}
