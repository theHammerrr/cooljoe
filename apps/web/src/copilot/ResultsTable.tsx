import { useExportExcel } from '../api/copilot/useExportExcel';

interface ResultsTableProps {
    tableResults: Record<string, unknown>[];
    onClear: () => void;
}

export function ResultsTable({ tableResults, onClear }: ResultsTableProps) {
    const { mutate: exportToExcel, isPending } = useExportExcel();

    if (!tableResults || tableResults.length === 0) return null;

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
