import type { QueryAnalysisIndexMetadata } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisIndexesSectionProps {
    indexes: QueryAnalysisIndexMetadata[];
}

export function QueryAnalysisIndexesSection({ indexes }: QueryAnalysisIndexesSectionProps) {
    return (
        <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Indexes</p>
            <div className="mt-3 space-y-3">
                {indexes.length === 0 && (
                    <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-3 text-sm text-slate-400">
                        No index metadata was found for the referenced tables.
                    </div>
                )}
                {indexes.map((index) => (
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
    );
}
