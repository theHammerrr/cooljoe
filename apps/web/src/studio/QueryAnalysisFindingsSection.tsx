import type { QueryAnalysisFinding } from '../api/copilot/useAnalyzeQuery';
import { QueryAnalysisFindingRuntimeContext } from './QueryAnalysisFindingRuntimeContext';

interface QueryAnalysisFindingsSectionProps {
    findings: QueryAnalysisFinding[];
    onSelectNode: (nodeId: string) => void;
    selectedNodeId: string;
}

export function QueryAnalysisFindingsSection({ findings, onSelectNode, selectedNodeId }: QueryAnalysisFindingsSectionProps) {
    return (
        <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Findings</p>
            <div className="mt-3 space-y-3">
                {findings.length === 0 && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
                        No obvious issues were detected in the first-pass analyzer. Review the raw plan before trusting that as "fast enough".
                    </div>
                )}
                {findings.map((finding) => (
                    <article
                        key={`${finding.category}:${finding.title}`}
                        className={`rounded-lg border p-4 ${
                            finding.runtimeContext?.nodeId === selectedNodeId
                                ? 'border-cyan-400/35 bg-cyan-500/5'
                                : 'border-white/5 bg-black/20'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-100">{finding.title}</h3>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    {finding.category.replace('_', ' ')} | {finding.severity} severity | {finding.confidence} confidence
                                </p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                                finding.severity === 'high'
                                    ? 'bg-red-500/15 text-red-200'
                                    : finding.severity === 'medium'
                                        ? 'bg-amber-500/15 text-amber-200'
                                        : 'bg-slate-500/15 text-slate-300'
                            }`}>
                                {finding.severity}
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {finding.evidenceSources.map((source) => (
                                <span
                                    key={source}
                                    className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                                        source === 'plan'
                                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                                            : source === 'metadata'
                                                ? 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-100'
                                                : 'border border-violet-500/20 bg-violet-500/10 text-violet-100'
                                    }`}
                                >
                                    {getEvidenceSourceLabel(source)}
                                </span>
                            ))}
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-slate-300">
                            {finding.evidence.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                        {finding.runtimeContext && (
                            <QueryAnalysisFindingRuntimeContext
                                runtimeContext={finding.runtimeContext}
                                isSelected={finding.runtimeContext.nodeId === selectedNodeId}
                                onSelectNode={onSelectNode}
                            />
                        )}
                        <p className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-sm text-cyan-50">
                            {finding.suggestion}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function getEvidenceSourceLabel(source: QueryAnalysisFinding['evidenceSources'][number]): string {
    if (source === 'plan') return 'Plan Evidence';

    if (source === 'metadata') return 'Metadata Inference';

    return 'SQL Shape';
}
