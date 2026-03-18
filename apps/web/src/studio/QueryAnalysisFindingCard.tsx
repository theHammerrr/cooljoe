import { useState } from 'react';
import type { QueryAnalysisFinding } from '../api/copilot/useAnalyzeQuery';
import { QueryAnalysisFindingRuntimeContext } from './QueryAnalysisFindingRuntimeContext';

interface QueryAnalysisFindingCardProps {
    finding: QueryAnalysisFinding;
    onSelectNode: (nodeId: string) => void;
    selectedNodeId: string;
}

export function QueryAnalysisFindingCard({ finding, onSelectNode, selectedNodeId }: QueryAnalysisFindingCardProps) {
    const activeNodeId = finding.focusNodeId || finding.runtimeContext?.nodeId;
    const [detailsOpen, setDetailsOpen] = useState(false);

    return (
        <article className={`rounded-xl border p-3 ${activeNodeId === selectedNodeId ? 'border-cyan-400/35 bg-cyan-500/5' : 'border-white/5 bg-black/20'}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getSeverityClassName(finding.severity)}`}>{finding.severity}</span>
                        {finding.reasonableness && <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getReasonablenessClassName(finding.reasonableness)}`}>{getReasonablenessLabel(finding.reasonableness)}</span>}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-100">{finding.title}</h3>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        {finding.category.replace('_', ' ')} | {finding.confidence} confidence
                    </p>
                    {finding.reasonablenessExplanation && <p className="mt-2 text-sm text-slate-300">{finding.reasonablenessExplanation}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                    {activeNodeId && (
                        <button
                            type="button"
                            onClick={() => onSelectNode(activeNodeId)}
                            className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${activeNodeId === selectedNodeId ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-black/20 text-slate-300 hover:text-slate-100'}`}
                        >
                            {activeNodeId === selectedNodeId ? 'Selected Node' : 'Focus Node'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setDetailsOpen((current) => !current)}
                        className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:text-slate-100"
                    >
                        {detailsOpen ? 'Hide Details' : 'Details'}
                    </button>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {finding.evidenceSources.map((source) => <span key={source} className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getEvidenceSourceClassName(source)}`}>{getEvidenceSourceLabel(source)}</span>)}
            </div>
            <p className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-sm text-cyan-50">{finding.suggestion}</p>
            {detailsOpen && (
                <div className="mt-3 space-y-3">
                    <ul className="space-y-1 text-sm text-slate-300">
                        {finding.evidence.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    {finding.sqlReferences && finding.sqlReferences.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">SQL Fragments</p>
                            <div className="mt-2 space-y-2">
                                {finding.sqlReferences.map((reference) => <code key={reference} className="block overflow-x-auto rounded-md bg-black/30 px-2 py-2 text-xs text-slate-200">{reference}</code>)}
                            </div>
                        </div>
                    )}
                    {finding.runtimeContext && <QueryAnalysisFindingRuntimeContext runtimeContext={finding.runtimeContext} isSelected={activeNodeId === selectedNodeId} onSelectNode={onSelectNode} />}
                </div>
            )}
        </article>
    );
}

function getSeverityClassName(severity: QueryAnalysisFinding['severity']): string {
    if (severity === 'high') return 'bg-red-500/15 text-red-200';

    if (severity === 'medium') return 'bg-amber-500/15 text-amber-200';

    return 'bg-slate-500/15 text-slate-300';
}

function getEvidenceSourceClassName(source: QueryAnalysisFinding['evidenceSources'][number]): string {
    if (source === 'plan') return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-100';

    if (source === 'metadata') return 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-100';

    return 'border border-violet-500/20 bg-violet-500/10 text-violet-100';
}

function getEvidenceSourceLabel(source: QueryAnalysisFinding['evidenceSources'][number]): string {
    if (source === 'plan') return 'Plan Evidence';

    if (source === 'metadata') return 'Metadata Inference';

    return 'SQL Shape';
}

function getReasonablenessClassName(reasonableness: NonNullable<QueryAnalysisFinding['reasonableness']>): string {
    if (reasonableness === 'high_priority') return 'border border-red-500/20 bg-red-500/10 text-red-100';

    if (reasonableness === 'worth_investigating') return 'border border-amber-500/20 bg-amber-500/10 text-amber-100';

    return 'border border-slate-500/20 bg-slate-500/10 text-slate-200';
}

function getReasonablenessLabel(reasonableness: NonNullable<QueryAnalysisFinding['reasonableness']>): string {
    if (reasonableness === 'high_priority') return 'Fix Likely Worth It';

    if (reasonableness === 'worth_investigating') return 'Worth Checking';

    return 'Planner May Be Fine';
}
