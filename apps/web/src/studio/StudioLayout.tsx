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
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAllowlist, setShowAllowlist] = useState(false);

    const { data: topology } = useGetSchemaTopology();

    const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema();

    const handleRefresh = () => {
        refreshSchema();
    };

    return (
        <div className="flex flex-col h-screen w-full bg-white overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 flex justify-between items-center shadow-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-xl tracking-wide flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                         AI-Augmented Studio
                    </span>
                    <span className="bg-indigo-900/50 px-2 py-0.5 rounded text-xs text-indigo-200 border border-indigo-500/30">v1.0</span>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowAllowlist(true)}
                        className="text-sm bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded flex items-center gap-2 font-medium"
                    >
                        🛡️ Allowed Tables
                    </button>
                    <button 
                        onClick={() => setShowAnalytics(true)}
                        className="text-sm bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded flex items-center gap-2 font-medium"
                    >
                        📊 Analytics
                    </button>
                </div>
            </header>

            {/* Three-Pane Workspace */}
            <div className="flex flex-1 min-h-0 relative">
                
                {/* 1. Left Sidebar: Schema Explorer */}
                <div className="w-64 shrink-0 flex flex-col border-r border-slate-200 shadow-[4px_0_24px_-15px_rgba(0,0,0,0.1)] z-10 bg-slate-50 relative">
                    <SchemaExplorer 
                        topology={topology ?? null} 
                        isRefreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                </div>

                {/* 2. Center Workspace: SQL Editor & Results */}
                <div className="flex-1 flex flex-col min-w-0 shadow-inner relative z-0">
                    <QueryWorkspace 
                        injectedSql={injectedSql} 
                        onResetInjectedSql={() => setInjectedSql('')} 
                    />
                </div>

                {/* 3. Right Sidebar: Copilot Chat */}
                <div className="w-[420px] shrink-0 border-l border-slate-200 bg-gray-50 flex flex-col shadow-[-4px_0_24px_-15px_rgba(0,0,0,0.1)] z-10 overflow-hidden">
                    <CopilotChat 
                        isEmbedded={true} 
                        onInjectSql={(sql: string) => setInjectedSql(sql)} 
                    />
                </div>
            </div>

            {showAllowlist && <AllowlistManager onClose={() => setShowAllowlist(false)} />}
            {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
        </div>
    );
}
