import { SchemaExplorerTree } from './SchemaExplorerTree';

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
        );
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
                <SchemaExplorerTree topology={topology} />
            </div>
        </div>
    );
}
