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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full">
                <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 className="text-lg font-medium text-slate-700">No rows returned</h3>
                <p className="text-sm mt-1 text-center max-w-sm">The query executed successfully, but zero records matched the criteria.</p>
                <button onClick={onClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-sm font-medium transition-colors">
                    Clear Workspace
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Results ({tableResults.length})</h4>
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={() => exportToExcel(tableResults)} 
                        disabled={isPending}
                        className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export .xlsx
                    </button>
                    <button onClick={onClear} className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                </div>
            </div>
            <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                        {Object.keys(tableResults[0]).map(k => (
                            <th key={k} className="px-2 py-1.5 border-b font-semibold">{k}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableResults.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                            {Object.values(row).map((val, j) => (
                                <td key={j} className="px-2 py-1.5 truncate max-w-[100px]">{String(val)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {tableResults.length > 10 && <div className="text-center text-gray-400 mt-2 text-[10px]">+ {tableResults.length - 10} more rows</div>}
        </div>
    );
}
