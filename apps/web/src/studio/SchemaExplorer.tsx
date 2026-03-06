
// Using a simplified local interface to represent what `useRefreshSchema` will ideally hydrate into cache
interface TopologyColumn {
    column: string;
    type: string;
    isPrimary?: boolean;
    foreignKeyTarget?: string | null;
}

interface SchemaExplorerProps {
    topology: Record<string, TopologyColumn[]> | null;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function SchemaExplorer({ topology, isRefreshing, onRefresh }: SchemaExplorerProps) {
    if (!topology) {
        return (
            <div className="flex flex-col h-full bg-[#0d1117] w-60 p-4 text-center items-center justify-center gap-4">
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">No Schema Synced</span>
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-1.5 px-4 rounded-lg transition-colors text-[11px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                >
                    <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRefreshing ? 'Syncing...' : 'Sync Schema'}
                </button>
            </div>
        )
    }

    // Group the flattened `schema.table` keys back into a nested tree
    const tree: Record<string, string[]> = {};

    for (const fullName of Object.keys(topology)) {
        const parts = fullName.split('.');

        if (parts.length === 1) {
            if (!tree['public']) tree['public'] = [];
            tree['public'].push(fullName);
        } else {
            const schemaName = parts[0];
            const tableName = parts[1];

            if (!tree[schemaName]) tree[schemaName] = [];
            tree[schemaName].push(tableName);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0d1117] w-60">
            <div className="px-3 py-2.5 border-b border-white/5 flex justify-between items-center shrink-0">
                <h2 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">DB Explorer</h2>
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="text-slate-600 hover:text-emerald-400 transition-colors p-1 hover:bg-white/5 rounded disabled:opacity-40"
                    title="Sync Database Schema"
                >
                    <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2">
                {Object.entries(tree).map(([schema, tables]) => (
                    <details key={schema} className="mb-1" open>
                        <summary className="font-black text-[10px] text-slate-600 uppercase tracking-widest px-2 py-1.5 cursor-pointer hover:text-slate-400 select-none flex items-center gap-1.5 rounded hover:bg-white/5 transition-colors outline-none">
                            <svg className="w-2.5 h-2.5 shrink-0 transition-transform details-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            {schema}
                        </summary>
                        <div className="pl-2 mt-0.5">
                            {tables.map(table => {
                                const fullTableName = schema === 'public' && !topology[table] ? `${schema}.${table}` : (topology[`${schema}.${table}`] ? `${schema}.${table}` : table);
                                const columns = topology[fullTableName] || [];

                                return (
                                    <details key={fullTableName} className="mb-0.5">
                                        <summary className="cursor-pointer text-[12px] text-slate-500 hover:text-slate-300 font-medium py-1 px-2 list-none flex items-center gap-1.5 select-none rounded hover:bg-white/5 transition-colors outline-none">
                                            <svg className="w-2.5 h-2.5 shrink-0 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <svg className="w-3 h-3 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18M10 3v18" />
                                            </svg>
                                            <span className="truncate">{table}</span>
                                        </summary>
                                        <div className="pl-6 ml-1 border-l border-white/5 text-[11px] flex flex-col mt-0.5 mb-1">
                                            {columns.map(col => (
                                                <div key={col.column} className="flex justify-between items-center group px-2 py-0.5 rounded hover:bg-white/5">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        {col.isPrimary && <span className="text-amber-500 text-[10px]" title="Primary Key">🔑</span>}
                                                        {!col.isPrimary && col.foreignKeyTarget && <span className="text-slate-500 text-[10px]" title={`FK → ${col.foreignKeyTarget}`}>🔗</span>}
                                                        <span className="text-slate-500 group-hover:text-slate-300 transition-colors truncate font-mono">{col.column}</span>
                                                    </div>
                                                    <span className="text-[9px] text-slate-700 group-hover:text-slate-600 shrink-0 ml-1">{col.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
