import { useGetAnalytics } from '../api/copilot/useGetAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function AnalyticsModal({ onClose }: { onClose: () => void }) {
    const { data, isLoading } = useGetAnalytics();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">System Analytics</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : !data ? (
                        <div className="text-center text-red-500 py-10">Failed to load analytics data.</div>
                    ) : (
                        <div className="space-y-8">
                            {/* Top Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="text-blue-500 text-sm font-semibold mb-1">Total Queries</div>
                                    <div className="text-2xl font-bold text-blue-900">{data.totalQueries}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="text-green-500 text-sm font-semibold mb-1">Avg Runtime</div>
                                    <div className="text-2xl font-bold text-green-900">{data.avgRuntimeMs}ms</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                    <div className="text-orange-500 text-sm font-semibold mb-1">Max Runtime</div>
                                    <div className="text-2xl font-bold text-orange-900">{data.maxRuntimeMs}ms</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <div className="text-purple-500 text-sm font-semibold mb-1">Avg Rows Ret.</div>
                                    <div className="text-2xl font-bold text-purple-900">{data.avgRowCount}</div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            {data.recentQueries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    
                                    {/* Line Chart: Latency Over Time */}
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Latency Over Time (ms)</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={[...data.recentQueries].reverse()}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis dataKey="createdAt" hide />
                                                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Line type="monotone" dataKey="runtimeMs" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Bar Chart: Recent Complexities */}
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Recent Executions</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.recentQueries.slice(0, 5)} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="createdAt" type="category" hide />
                                                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="runtimeMs" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                                    No queries executed yet. Start asking questions to populate graphs!
                                </div>
                            )}

                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        Close Modal
                    </button>
                </div>
            </div>
        </div>
    );
}
