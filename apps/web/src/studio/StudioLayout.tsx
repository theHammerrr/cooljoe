import { useRef, useState } from 'react';
import { QueryAnalysisPage } from './QueryAnalysisPage';
import { useRefreshSchema } from '../api/copilot/useRefreshSchema';
import { AnalyticsModal } from '../copilot/AnalyticsModal';
import { useGetSchemaTopology } from '../api/copilot/useGetSchemaTopology';
import { AllowlistManager } from './AllowlistManager';
import { StudioWorkspaceShell } from './StudioWorkspaceShell';
import { useStudioPaneSizing } from './useStudioPaneSizing';
import { applyInjectedQuery } from './studioInjection';
import { StudioTopBar } from './StudioTopBar';
import { useAllowlist } from '../api/copilot/useAllowlist';

export function StudioLayout() {
    const [activePage, setActivePage] = useState<'workspace' | 'analysis'>('workspace');
    const [injectedSql, setInjectedSql] = useState<string>('');
    const [injectedPrisma, setInjectedPrisma] = useState<string>('');
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'sql' | 'prisma'>('sql');
    const [sql, setSql] = useState<string>('SELECT * FROM public.users LIMIT 10;');
    const [prismaJs, setPrismaJs] = useState<string>('prisma.users.findMany({\n  take: 10\n})');
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
    const { allowlistEnabled } = useAllowlist();

    return (
        <div className="flex flex-col h-screen w-full bg-[#0d1117] overflow-hidden font-sans text-slate-300">
            <StudioTopBar
                activePage={activePage}
                allowlistEnabled={allowlistEnabled}
                onResetLayout={resetLayoutWidths}
                onOpenAllowlist={() => setShowAllowlist(true)}
                onOpenAnalytics={() => setShowAnalytics(true)}
                onPageChange={setActivePage}
            />

            {activePage === 'workspace' ? (
                <StudioWorkspaceShell
                    activeWorkspaceTab={activeWorkspaceTab}
                    adjustLeftWidth={adjustLeftWidth}
                    adjustRightWidth={adjustRightWidth}
                    containerRef={containerRef}
                    injectedPrisma={injectedPrisma}
                    injectedSql={injectedSql}
                    isRefreshing={isRefreshing}
                    leftWidth={leftWidth}
                    onInjectSql={(nextSql: string, prisma?: string) => applyInjectedQuery(
                        nextSql,
                        prisma,
                        setInjectedSql,
                        setInjectedPrisma,
                        setActiveWorkspaceTab
                    )}
                    onPrismaChange={setPrismaJs}
                    onRefresh={() => refreshSchema()}
                    onResetInjected={() => { setInjectedSql(''); setInjectedPrisma(''); }}
                    onSqlChange={setSql}
                    onTabChange={setActiveWorkspaceTab}
                    prismaJs={prismaJs}
                    resetLeftWidth={resetLeftWidth}
                    resetRightWidth={resetRightWidth}
                    rightWidth={rightWidth}
                    sql={sql}
                    startLeftResize={startLeftResize}
                    startRightResize={startRightResize}
                    topology={topology ?? null}
                />
            ) : (
                <div className="flex flex-1 min-h-0">
                    <QueryAnalysisPage
                        injectedSql={injectedSql}
                        onResetInjected={() => setInjectedSql('')}
                        onSqlChange={setSql}
                        sql={sql}
            <div ref={containerRef} className="flex flex-1 min-h-0 relative">
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
            )}

            {allowlistEnabled && showAllowlist && <AllowlistManager onClose={() => setShowAllowlist(false)} />}
            {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
        </div>
    );
}
