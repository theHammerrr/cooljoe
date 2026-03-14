import type { QueryAnalysisTableStats } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisTableStatsSectionProps {
    tableStats: QueryAnalysisTableStats[];
}

export function QueryAnalysisTableStatsSection({ tableStats }: QueryAnalysisTableStatsSectionProps) {
    return (
        <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Table Stats</p>
            <div className="mt-3 space-y-3">
                {tableStats.length === 0 && (
                    <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-3 text-sm text-slate-400">
                        No table row estimates were loaded for the referenced tables.
                    </div>
                )}
                {tableStats.map((tableStat) => (
                    <article key={`${tableStat.schemaName}.${tableStat.tableName}`} className="rounded-lg border border-white/5 bg-black/20 p-3">
                        <p className="text-sm font-semibold text-slate-100">{tableStat.schemaName}.{tableStat.tableName}</p>
                        <p className="mt-1 text-sm text-slate-300">Estimated rows: {Math.round(tableStat.estimatedRows)}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
