import { useState } from 'react';
import { useAllowlist } from '../api/copilot/useAllowlist';
import { useAllowTable } from '../api/copilot/useAllowTable';

interface AllowlistManagerProps {
    onClose: () => void;
}

export function AllowlistManager({ onClose }: AllowlistManagerProps) {
    const { allowedTables, isFetching, removeTable, isRemoving } = useAllowlist();
    const { mutate: allowTable, isPending: isAdding } = useAllowTable();
    const [newTable, setNewTable] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTable.trim()) return;
        
        allowTable({ table: newTable.trim() }, {
            onSuccess: () => {
                setSuccessMsg(`Added '${newTable.trim()}' to allowlist.`);
                setNewTable('');
                setTimeout(() => setSuccessMsg(''), 3000);
            },
            onError: (err) => {
                alert(`Error: ${err.message}`);
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        🛡️ Table Permissions Allowlist
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 px-2 py-1 rounded transition-colors text-lg" title="Close">
                        ✕
                    </button>
                </div>

                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm text-slate-600 mb-3">
                        The AI and manual execution engines are strictly sandboxed. They can ONLY query tables explicitly listed below.
                    </p>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newTable}
                            onChange={e => setNewTable(e.target.value)}
                            placeholder="e.g., auth.users"
                            className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                        <button 
                            type="submit"
                            disabled={isAdding || !newTable.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-sm rounded transition-colors font-medium disabled:opacity-50"
                        >
                            {isAdding ? "Adding..." : "+ Add"}
                        </button>
                    </form>
                    {successMsg && (
                        <div className="mt-2 text-xs text-green-600 bg-green-50 p-1.5 rounded border border-green-200 flex items-center gap-1">
                            ✅ {successMsg}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-white">
                    {isFetching ? (
                        <div className="flex justify-center py-8 text-slate-400">Loading configurations...</div>
                    ) : allowedTables.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 italic">No tables allowed. All queries will be blocked.</div>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {allowedTables.map((table: string) => (
                                <li key={table} className="flex justify-between items-center p-2 rounded border border-slate-100 bg-slate-50 hover:bg-slate-100 group transition-colors">
                                    <span className="font-mono text-sm text-slate-700 font-medium">📜 {table}</span>
                                    <button 
                                        onClick={() => {
                                            removeTable(table, {
                                                onSuccess: () => {
                                                    setSuccessMsg(`Removed '${table}'.`);
                                                    setTimeout(() => setSuccessMsg(''), 3000);
                                                }
                                            });
                                        }}
                                        disabled={isRemoving}
                                        className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 font-semibold"
                                        title={`Revoke access to ${table}`}
                                    >
                                        Revoke
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
