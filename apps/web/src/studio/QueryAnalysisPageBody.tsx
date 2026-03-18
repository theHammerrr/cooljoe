import type { ReactNode } from 'react';
import type { QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';
import { QueryAnalysisAiSummarySection } from './QueryAnalysisAiSummarySection';
import { QueryAnalysisFindingsSection } from './QueryAnalysisFindingsSection';
import { QueryAnalysisPageCenter } from './QueryAnalysisPageCenter';
import { QueryAnalysisSidebar } from './QueryAnalysisSidebar';

interface QueryAnalysisPageBodyProps {
    analysis: QueryAnalysisResult | null;
    analysisError: string | null;
    editor: ReactNode;
    onSelectNode: (nodeId: string) => void;
    selectedNodeId: string | null;
}

export function QueryAnalysisPageBody({
    analysis,
    analysisError,
    editor,
    onSelectNode,
    selectedNodeId
}: QueryAnalysisPageBodyProps) {
    return (
        <>
            <aside className="min-h-0 overflow-auto rounded-2xl border border-white/6 bg-[#0f1520] p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">Findings</p>
                        <p className="mt-1 text-sm text-slate-400">Ranked performance issues and supporting evidence.</p>
                    </div>
                    {analysis && <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-100">{analysis.findings.length}</span>}
                </div>

                {analysis ? (
                    <QueryAnalysisFindingsSection
                        findings={analysis.findings}
                        onSelectNode={onSelectNode}
                        selectedNodeId={selectedNodeId || analysis.rawPlan.nodeId}
                    />
                ) : (
                    <EmptyPanel text="Run analysis to populate performance findings, index mismatches, and runtime drift." />
                )}
            </aside>

            <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
                {editor}

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
                    <div className="min-h-0 overflow-auto rounded-2xl border border-white/6 bg-[#0f1520] p-4">
                        <QueryAnalysisPageCenter analysis={analysis} analysisError={analysisError} />
                    </div>

                    <div className="min-h-0 overflow-auto rounded-2xl border border-white/6 bg-[#0f1520] p-4">
                        {analysis ? (
                            <QueryAnalysisAiSummarySection aiSummary={analysis.aiSummary} analysis={analysis} />
                        ) : (
                            <EmptyPanel text="Optional AI guidance stays in a separate block with a hallucination warning, so it never overrides deterministic findings." />
                        )}
                    </div>
                </div>
            </section>

            <aside className="min-h-0 overflow-auto rounded-2xl border border-white/6 bg-[#0f1520] p-4">
                <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">Plan Inspector</p>
                    <p className="mt-1 text-sm text-slate-400">Keep the tree and selected node visible while tracing a bottleneck.</p>
                </div>
                {analysis ? (
                    <QueryAnalysisSidebar
                        analysis={analysis}
                        selectedNodeId={selectedNodeId || analysis.rawPlan.nodeId}
                        onSelectNode={onSelectNode}
                    />
                ) : (
                    <EmptyPanel text="The execution plan tree, selected node details, indexes, and table stats will appear here after analysis." />
                )}
            </aside>
        </>
    );
}

function EmptyPanel({ text }: { text: string }) {
    return (
        <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 px-6 py-8 text-center text-sm text-slate-500">
            {text}
        </div>
    );
}
