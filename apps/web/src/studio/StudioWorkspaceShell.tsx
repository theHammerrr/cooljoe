import type { TopologyColumn } from '../api/copilot/useGetSchemaTopology';
import { CopilotChat } from '../copilot/CopilotChat';
import { QueryWorkspace } from './QueryWorkspace';
import { ResizeHandle } from './ResizeHandle';
import { SchemaExplorer } from './SchemaExplorer';

interface StudioWorkspaceShellProps {
    activeWorkspaceTab: 'sql' | 'prisma';
    adjustLeftWidth: (delta: number) => void;
    adjustRightWidth: (delta: number) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    injectedPrisma: string;
    injectedSql: string;
    isRefreshing: boolean;
    leftWidth: number;
    onInjectSql: (sql: string, prisma?: string) => void;
    onPrismaChange: (prismaJs: string) => void;
    onRefresh: () => void;
    onResetInjected: () => void;
    onSqlChange: (sql: string) => void;
    onTabChange: (tab: 'sql' | 'prisma') => void;
    resetLeftWidth: () => void;
    resetRightWidth: () => void;
    rightWidth: number;
    prismaJs: string;
    sql: string;
    startLeftResize: (event: React.MouseEvent<HTMLDivElement>, container: HTMLDivElement | null) => void;
    startRightResize: (event: React.MouseEvent<HTMLDivElement>, container: HTMLDivElement | null) => void;
    topology: Record<string, TopologyColumn[]> | null;
}

export function StudioWorkspaceShell({
    activeWorkspaceTab,
    adjustLeftWidth,
    adjustRightWidth,
    containerRef,
    injectedPrisma,
    injectedSql,
    isRefreshing,
    leftWidth,
    onInjectSql,
    onPrismaChange,
    onRefresh,
    onResetInjected,
    onSqlChange,
    onTabChange,
    resetLeftWidth,
    resetRightWidth,
    rightWidth,
    prismaJs,
    sql,
    startLeftResize,
    startRightResize,
    topology
}: StudioWorkspaceShellProps) {
    return (
        <div ref={containerRef} className="flex flex-1 min-h-0 relative">
            <div className="shrink-0 flex flex-col border-r border-white/5 z-10 bg-[#0d1117] relative" style={{ width: leftWidth }}>
                <SchemaExplorer
                    topology={topology}
                    isRefreshing={isRefreshing}
                    onRefresh={onRefresh}
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
                    onPrismaChange={onPrismaChange}
                    onResetInjected={onResetInjected}
                    onSqlChange={onSqlChange}
                    onTabChange={onTabChange}
                    prismaJs={prismaJs}
                    sql={sql}
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
                    onInjectSql={onInjectSql}
                />
            </div>
        </div>
    );
}
