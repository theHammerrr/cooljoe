import { useGetAnalytics } from '../api/copilot/useGetAnalytics';

export function AnalyticsModal({ onClose }: { onClose: () => void }) {
    const { data, isLoading: loading } = useGetAnalytics();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white flex justify-between items-center shadow-md">
                    <h3 className="font-bold text-lg tracking-wide">DB Copilot Analytics</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                        ✕
                    </button>
                </div>
                
                <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-teal-600">{data.totalQueries}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Queries</span>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-teal-600">{data.avgRuntimeMs}ms</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg Runtime</span>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-red-500">{data.maxRuntimeMs}ms</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Max Runtime</span>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-teal-600">{data.avgRowCount}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg Rows</span>
                                </div>
                            </div>

                            {/* Recent Queries Table */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b text-sm font-bold text-gray-700">Recent Queries</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2">Time</th>
                                                <th className="px-4 py-2">Runtime</th>
                                                <th className="px-4 py-2">SQL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.recentQueries.map((q, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{new Date(q.createdAt).toLocaleTimeString()}</td>
                                                    <td className="px-4 py-2 font-mono text-teal-600">{q.runtimeMs}ms</td>
                                                    <td className="px-4 py-2 font-mono text-gray-600 text-[10px] break-all max-w-xs">{q.sqlQuery}</td>
                                                </tr>
                                            ))}
                                            {data.recentQueries.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">No queries logged yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-red-500">Failed to load analytics data.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
