/* eslint-disable max-lines */

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
            <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-64 p-4 text-center items-center justify-center">
                <span className="text-slate-400 text-sm mb-4 justify-center">No Schema Synced</span>
                 <button 
                    onClick={onRefresh} 
                    disabled={isRefreshing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded shadow transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {isRefreshing ? '🔄 Syncing...' : '🔄 Sync Schema DB'}
                </button>
            </div>
        )
    }

    // Group the flattened `schema.table` keys back into a nested tree for the UI navigator
    const tree: Record<string, string[]> = {};
    for (const fullName of Object.keys(topology)) {
        const parts = fullName.split('.');
        if (parts.length === 1) {
            // Assume public if missing schema
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
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-64">
            <div className="p-3 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800 text-sm tracking-wide">DB Explorer</h2>
                <button 
                    onClick={onRefresh} 
                    disabled={isRefreshing}
                    className="text-slate-500 hover:text-indigo-600 transition-colors"
                    title="Sync Database Schema Constraints"
                >
                    {isRefreshing ? '🔄' : '🔄'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {Object.entries(tree).map(([schema, tables]) => (
                    <div key={schema} className="mb-2">
                        <div className="font-bold text-xs text-slate-500 uppercase tracking-wider pl-1 mb-1">
                            📂 {schema}
                        </div>
                        <div className="pl-3 border-l border-slate-200 ml-2">
                            {tables.map(table => {
                                const fullTableName = schema === 'public' && !topology[table] ? `${schema}.${table}` : (topology[`${schema}.${table}`] ? `${schema}.${table}` : table);
                                const columns = topology[fullTableName] || [];
                                
                                return (
                                    <details key={fullTableName} className="mb-1">
                                        <summary className="cursor-pointer text-sm text-slate-700 hover:text-indigo-600 font-medium py-1 list-none flex items-center gap-1 select-none">
                                            <span className="text-slate-400 text-xs text-[10px]">▶</span> 
                                            <span className="truncate">📋 {table}</span>
                                        </summary>
                                        <div className="pl-4 ml-1 border-l border-slate-200 text-xs text-slate-600 flex flex-col gap-1 mt-1">
                                            {columns.map(col => (
                                                <div key={col.column} className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-1 truncate">
                                                        {col.isPrimary && <span className="text-amber-500" title="Primary Key">🔑</span>}
                                                        {!col.isPrimary && col.foreignKeyTarget && <span className="text-slate-400 font-bold" title={`Foreign Key to ${col.foreignKeyTarget}`}>🔗</span>}
                                                        <span className="group-hover:text-slate-900 group-hover:font-medium transition-colors truncate">{col.column}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 group-hover:text-slate-500">{col.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
