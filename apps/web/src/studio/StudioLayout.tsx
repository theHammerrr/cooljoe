import { useState } from 'react';
import { SchemaExplorer } from './SchemaExplorer';
import { QueryWorkspace } from './QueryWorkspace';
import { CopilotChat } from '../copilot/CopilotChat';
import { useRefreshSchema } from '../api/copilot/useRefreshSchema';
import { AnalyticsModal } from '../copilot/AnalyticsModal';
import { useGetSchemaTopology } from '../api/copilot/useGetSchemaTopology';
import { AllowlistManager } from './AllowlistManager';

export function StudioLayout() {
    const [injectedSql, setInjectedSql] = useState<string>('');
    const [injectedPrisma, setInjectedPrisma] = useState<string>('');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAllowlist, setShowAllowlist] = useState(false);

    const { data: topology } = useGetSchemaTopology();
    const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema();

    return (
        <div className="flex flex-col h-screen w-full bg-[#0d1117] overflow-hidden font-sans text-slate-300">
            {/* Top Navigation Bar */}
            <header className="bg-[#161b22] border-b border-white/5 px-4 py-2.5 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-slate-100 tracking-tight">AI Copilot Studio</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">v1.0</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAllowlist(true)}
                        className="text-[11px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 hover:text-slate-200 transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Allowlist
                    </button>
                    <button
                        onClick={() => setShowAnalytics(true)}
                        className="text-[11px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 hover:text-slate-200 transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Analytics
                    </button>
                </div>
            </header>

            {/* Three-Pane Workspace */}
            <div className="flex flex-1 min-h-0 relative">
                {/* Left Sidebar: Schema Explorer */}
                <div className="w-60 shrink-0 flex flex-col border-r border-white/5 z-10 bg-[#0d1117] relative">
                    <SchemaExplorer
                        topology={topology ?? null}
                        isRefreshing={isRefreshing}
                        onRefresh={() => refreshSchema()}
                    />
                </div>

                {/* Center Workspace */}
                <div className="flex-1 flex flex-col min-w-0 relative z-0">
                    <QueryWorkspace
                        injectedSql={injectedSql}
                        injectedPrisma={injectedPrisma}
                        onResetInjected={() => { setInjectedSql(''); setInjectedPrisma(''); }}
                    />
                </div>

                {/* Right Sidebar: Copilot Chat */}
                <div className="w-[400px] shrink-0 border-l border-white/5 flex flex-col z-10 overflow-hidden">
                    <CopilotChat
                        isEmbedded={true}
                        onInjectSql={(sql: string, prisma?: string) => { setInjectedSql(sql); setInjectedPrisma(prisma || ''); }}
                    />
                </div>
            </div>

            {showAllowlist && <AllowlistManager onClose={() => setShowAllowlist(false)} />}
            {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
        </div>
    );
}
