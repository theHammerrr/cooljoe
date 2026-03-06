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
            onError: (err) => { alert(`Error: ${err.message}`); }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h2 className="font-black text-sm text-slate-200 uppercase tracking-widest">Table Allowlist</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 p-1.5 hover:bg-white/5 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Add form */}
                <div className="px-5 py-4 border-b border-white/5 shrink-0">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Only explicitly allowed tables can be queried by the AI and manual execution engines.
                    </p>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newTable}
                            onChange={e => setNewTable(e.target.value)}
                            placeholder="e.g., auth.users"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-white/20 font-mono"
                        />
                        <button
                            type="submit"
                            disabled={isAdding || !newTable.trim()}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 text-[11px] rounded-lg transition-colors font-black uppercase tracking-widest disabled:opacity-40"
                        >
                            {isAdding ? 'Adding...' : '+ Add'}
                        </button>
                    </form>
                    {successMsg && (
                        <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            {successMsg}
                        </div>
                    )}
                </div>

                {/* Table list */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {isFetching ? (
                        <div className="flex justify-center py-8 text-slate-600 text-sm">Loading...</div>
                    ) : allowedTables.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 text-xs font-medium uppercase tracking-widest">No tables allowed. All queries will be blocked.</div>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {allowedTables.map((table: string) => (
                                <li key={table} className="flex justify-between items-center px-3 py-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/8 group transition-colors">
                                    <span className="font-mono text-sm text-slate-400 font-medium truncate">{table}</span>
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
                                        className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 ml-3 shrink-0"
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
