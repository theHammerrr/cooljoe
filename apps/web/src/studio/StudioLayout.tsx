import { useRef, useState } from 'react';
import { SchemaExplorer } from './SchemaExplorer';
import { QueryWorkspace } from './QueryWorkspace';
import { CopilotChat } from '../copilot/CopilotChat';
import { useRefreshSchema } from '../api/copilot/useRefreshSchema';
import { AnalyticsModal } from '../copilot/AnalyticsModal';
import { useGetSchemaTopology } from '../api/copilot/useGetSchemaTopology';
import { AllowlistManager } from './AllowlistManager';
import { ResizeHandle } from './ResizeHandle';
import { useStudioPaneSizing } from './useStudioPaneSizing';
import { applyInjectedQuery } from './studioInjection';
import { StudioTopBar } from './StudioTopBar';

export function StudioLayout() {
    const [injectedSql, setInjectedSql] = useState<string>('');
    const [injectedPrisma, setInjectedPrisma] = useState<string>('');
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'sql' | 'prisma'>('sql');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAllowlist, setShowAllowlist] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const {
        leftWidth,
        rightWidth,
        startLeftResize,
        startRightResize,
        resetLeftWidth,
        resetRightWidth,
        adjustLeftWidth,
        adjustRightWidth,
        resetLayoutWidths
    } = useStudioPaneSizing();

    const { data: topology } = useGetSchemaTopology();
    const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema();

    return (
        <div className="flex flex-col h-screen w-full bg-[#0d1117] overflow-hidden font-sans text-slate-300">
            <StudioTopBar
                onResetLayout={resetLayoutWidths}
                onOpenAllowlist={() => setShowAllowlist(true)}
                onOpenAnalytics={() => setShowAnalytics(true)}
            />

            {/* Three-Pane Workspace */}
            <div ref={containerRef} className="flex flex-1 min-h-0 relative">
                {/* Left Sidebar: Schema Explorer */}
                <div className="shrink-0 flex flex-col border-r border-white/5 z-10 bg-[#0d1117] relative" style={{ width: leftWidth }}>
                    <SchemaExplorer
                        topology={topology ?? null}
                        isRefreshing={isRefreshing}
                        onRefresh={() => refreshSchema()}
                    />
                </div>
                <ResizeHandle
                    orientation="horizontal"
                    onMouseDown={(event) => startLeftResize(event, containerRef.current)}
                    onDoubleClick={resetLeftWidth}
                    onAdjust={adjustLeftWidth}
                />

                {/* Center Workspace */}
                <div className="flex-1 flex flex-col min-w-0 relative z-0">
                    <QueryWorkspace
                        activeTab={activeWorkspaceTab}
                        injectedSql={injectedSql}
                        injectedPrisma={injectedPrisma}
                        onTabChange={setActiveWorkspaceTab}
                        onResetInjected={() => { setInjectedSql(''); setInjectedPrisma(''); }}
                    />
                </div>
                <ResizeHandle
                    orientation="horizontal"
                    onMouseDown={(event) => startRightResize(event, containerRef.current)}
                    onDoubleClick={resetRightWidth}
                    onAdjust={adjustRightWidth}
                />

                {/* Right Sidebar: Copilot Chat */}
                <div className="shrink-0 border-l border-white/5 flex flex-col z-10 overflow-hidden" style={{ width: rightWidth }}>
                    <CopilotChat
                        isEmbedded={true}
                        onInjectSql={(sql: string, prisma?: string) => applyInjectedQuery(
                            sql,
                            prisma,
                            setInjectedSql,
                            setInjectedPrisma,
                            setActiveWorkspaceTab
                        )}
                    />
                </div>
            </div>

            {showAllowlist && <AllowlistManager onClose={() => setShowAllowlist(false)} />}
            {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
        </div>
    );
}
