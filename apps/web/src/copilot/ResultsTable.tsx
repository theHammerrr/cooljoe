import { useExportExcel } from '../api/copilot/useExportExcel';

interface ResultsTableProps {
    tableResults: Record<string, unknown>[];
    onClear: () => void;
}

export function ResultsTable({ tableResults, onClear }: ResultsTableProps) {
    const { mutate: exportToExcel, isPending } = useExportExcel();

    if (!tableResults) return null;

    if (tableResults.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#161b22]/50 border border-white/5 rounded-3xl p-12 shadow-2xl h-full animate-in zoom-in-95 duration-500 max-w-2xl mx-auto my-auto self-center">
                <div className="relative group mb-8">
                    <div className="absolute inset-0 bg-slate-500/10 rounded-3xl blur-2xl group-hover:bg-slate-500/20 transition-all duration-700"></div>
                    <div className="relative w-20 h-20 bg-[#161b22] rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl">
                        <svg className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                </div>
                <h3 className="text-lg font-black text-slate-200 uppercase tracking-widest">No rows returned</h3>
                <p className="text-xs mt-3 text-center text-slate-500 max-w-xs leading-relaxed font-medium">
                    The query executed successfully, but zero records matched your criteria in the database.
                </p>
                <button 
                    onClick={onClear} 
                    className="mt-10 px-8 py-3 bg-[#1f2937] hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 shadow-xl"
                >
                    Reset Workspace
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#161b22]/80 border border-white/5 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1c2128]/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Executed</span>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <h4 className="font-black text-slate-300 text-[11px] uppercase tracking-widest">
                        Dataset <span className="text-slate-500 ml-1.5 font-bold">[{tableResults.length}]</span>
                    </h4>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => exportToExcel(tableResults)} 
                        disabled={isPending}
                        className="text-[10px] bg-white hover:bg-slate-200 text-black px-4 py-2 rounded-lg shadow-xl font-black uppercase tracking-widest flex items-center gap-2.5 transition-all disabled:opacity-30 active:scale-95"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export
                    </button>
                    <button 
                        onClick={onClear} 
                        className="text-slate-500 hover:text-white transition-all p-1.5 hover:bg-white/5 rounded-lg"
                        title="Clear results"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto selection:bg-emerald-500/20">
                <table className="w-full text-left text-[11px] text-slate-400 border-collapse">
                    <thead>
                        <tr className="bg-black/20">
                            {Object.keys(tableResults[0]).map(k => (
                                <th key={k} className="px-6 py-4 border-b border-white/5 font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{k}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tableResults.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-all duration-300 group">
                                {Object.values(row).map((val, j) => (
                                    <td key={j} className="px-6 py-4 truncate max-w-[240px] text-slate-400 group-hover:text-slate-100 transition-colors font-mono">
                                        {val === null ? <span className="text-slate-700 italic font-sans">null</span> : String(val)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {tableResults.length > 10 && (
                <div className="bg-black/10 px-6 py-3 border-t border-white/5 flex justify-center">
                    <span className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">
                        Displaying first 10 of {tableResults.length} records
                    </span>
                </div>
            )}
        </div>
    );
}
