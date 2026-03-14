import type { QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';

interface QueryAnalysisSidebarProps {
    analysis: QueryAnalysisResult;
}

export function QueryAnalysisSidebar({ analysis }: QueryAnalysisSidebarProps) {
    return (
        <div className="space-y-4">
            <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Indexes</p>
                <div className="mt-3 space-y-3">
                    {analysis.indexes.length === 0 && (
                        <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-3 text-sm text-slate-400">
                            No index metadata was found for the referenced tables.
                        </div>
                    )}
                    {analysis.indexes.map((index) => (
                        <article key={`${index.schemaName}.${index.tableName}.${index.indexName}`} className="rounded-lg border border-white/5 bg-black/20 p-3">
                            <p className="text-sm font-semibold text-slate-100">{index.indexName}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                {index.schemaName}.{index.tableName} | {index.accessMethod}
                                {index.isPrimary ? ' | primary' : ''}
                                {index.isUnique ? ' | unique' : ''}
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                                Columns: {index.columns.length > 0 ? index.columns.join(', ') : 'unknown'}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Root Plan Node</p>
                <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3 text-sm text-slate-300">
                    <p>Node: {analysis.rawPlan.nodeType}</p>
                    {analysis.rawPlan.relationName && <p>Relation: {analysis.rawPlan.schema ? `${analysis.rawPlan.schema}.` : ''}{analysis.rawPlan.relationName}</p>}
                    {typeof analysis.rawPlan.planRows === 'number' && <p>Estimated rows: {analysis.rawPlan.planRows}</p>}
                    {typeof analysis.rawPlan.actualRows === 'number' && <p>Actual rows: {analysis.rawPlan.actualRows}</p>}
                    {typeof analysis.rawPlan.actualLoops === 'number' && <p>Actual loops: {analysis.rawPlan.actualLoops}</p>}
                    {typeof analysis.rawPlan.totalCost === 'number' && <p>Total cost: {analysis.rawPlan.totalCost}</p>}
                    {typeof analysis.rawPlan.actualTotalTime === 'number' && <p>Actual total time: {analysis.rawPlan.actualTotalTime.toFixed(3)} ms</p>}
                    {typeof analysis.rawPlan.buffers?.sharedHitBlocks === 'number' && <p>Shared hit blocks: {analysis.rawPlan.buffers.sharedHitBlocks}</p>}
                    {typeof analysis.rawPlan.buffers?.sharedReadBlocks === 'number' && <p>Shared read blocks: {analysis.rawPlan.buffers.sharedReadBlocks}</p>}
                </div>
            </section>

            <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Table Stats</p>
                <div className="mt-3 space-y-3">
                    {analysis.tableStats.length === 0 && (
                        <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-3 text-sm text-slate-400">
                            No table row estimates were loaded for the referenced tables.
                        </div>
                    )}
                    {analysis.tableStats.map((tableStat) => (
                        <article key={`${tableStat.schemaName}.${tableStat.tableName}`} className="rounded-lg border border-white/5 bg-black/20 p-3">
                            <p className="text-sm font-semibold text-slate-100">{tableStat.schemaName}.{tableStat.tableName}</p>
                            <p className="mt-1 text-sm text-slate-300">Estimated rows: {Math.round(tableStat.estimatedRows)}</p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
