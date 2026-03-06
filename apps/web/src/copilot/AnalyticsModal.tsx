import { useGetAnalytics } from '../api/copilot/useGetAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { STAT_CARDS, tooltipStyle } from './analyticsModal.constants';

export function AnalyticsModal({ onClose }: { onClose: () => void }) {
    const { data, isLoading } = useGetAnalytics();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl w-[820px] max-w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h2 className="font-black text-sm text-slate-200 uppercase tracking-widest">System Analytics</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 p-1.5 hover:bg-white/5 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                    ) : !data ? (
                        <div className="text-center text-slate-600 py-10 text-sm">Failed to load analytics data.</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {STAT_CARDS.map(({ key, label, suffix, color, bg }) => (
                                    <div key={key} className={`p-4 rounded-xl border ${bg}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${color}`}>{label}</div>
                                        <div className={`text-2xl font-black ${color}`}>
                                            {String(data[key])}{suffix || ''}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts */}
                            {data.recentQueries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                        <h3 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest">Latency Over Time (ms)</h3>
                                        <div className="h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={[...data.recentQueries].reverse()}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="createdAt" hide />
                                                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={tooltipStyle} />
                                                    <Line type="monotone" dataKey="runtimeMs" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10b981' }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                        <h3 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest">Recent Executions</h3>
                                        <div className="h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.recentQueries.slice(0, 5)} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="createdAt" type="category" hide />
                                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={tooltipStyle} />
                                                    <Bar dataKey="runtimeMs" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-600 py-10 bg-white/5 rounded-xl border border-white/5 border-dashed text-xs font-medium uppercase tracking-widest">
                                    No queries executed yet. Start asking questions to populate graphs!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-white/5 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
