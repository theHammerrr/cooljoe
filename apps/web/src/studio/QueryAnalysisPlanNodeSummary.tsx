import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';
import { getPlanNodeMetadata } from './queryAnalysisPlanMetadata';

interface QueryAnalysisPlanNodeSummaryProps {
    node: QueryAnalysisPlanNode;
}

export function QueryAnalysisPlanNodeSummary({ node }: QueryAnalysisPlanNodeSummaryProps) {
    const metadata = getPlanNodeMetadata(node);

    return (
        <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Selected Plan Node</p>
            <div className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3 text-sm text-cyan-50">
                <p className="font-semibold">{metadata.meaning}</p>
                <p className="mt-1 text-cyan-100/80">{metadata.sqlReference}</p>
            </div>
            {node.sqlReferences.length > 0 && (
                <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">SQL Fragments</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                        {node.sqlReferences.map((reference) => <li key={reference}>{reference}</li>)}
                    </ul>
                </div>
            )}
            <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3 text-sm text-slate-300">
                <p>Node ID: {node.nodeId}</p>
                <p>Node: {node.nodeType}</p>
                {node.relationName && <p>Relation: {node.schema ? `${node.schema}.` : ''}{node.relationName}</p>}
                {typeof node.planRows === 'number' && <p>Estimated rows: {node.planRows}</p>}
                {typeof node.actualRows === 'number' && <p>Actual rows: {node.actualRows}</p>}
                {typeof node.actualLoops === 'number' && <p>Actual loops: {node.actualLoops}</p>}
                {typeof node.totalCost === 'number' && <p>Total cost: {node.totalCost}</p>}
                {typeof node.actualTotalTime === 'number' && <p>Actual total time: {node.actualTotalTime.toFixed(3)} ms</p>}
                {typeof node.buffers?.sharedHitBlocks === 'number' && <p>Shared hit blocks: {node.buffers.sharedHitBlocks}</p>}
                {typeof node.buffers?.sharedReadBlocks === 'number' && <p>Shared read blocks: {node.buffers.sharedReadBlocks}</p>}
            </div>
        </section>
    );
}
