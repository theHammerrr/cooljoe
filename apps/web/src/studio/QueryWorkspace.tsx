import { useRef, useState } from 'react';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { QueryWorkspaceContent } from './QueryWorkspaceContent';
import { QueryWorkspaceHeader } from './QueryWorkspaceHeader';
import { QueryWorkspaceFooter } from './QueryWorkspaceFooter';
import { useWorkspaceSplitSizing } from './useWorkspaceSplitSizing';
interface QueryWorkspaceProps {
    injectedSql: string;
    injectedPrisma?: string;
    activeTab: 'sql' | 'prisma';
    onTabChange: (tab: 'sql' | 'prisma') => void;
    onResetInjected: () => void;
}

export function QueryWorkspace({ injectedSql, injectedPrisma, activeTab, onTabChange, onResetInjected }: QueryWorkspaceProps) {
    const splitContainerRef = useRef<HTMLDivElement | null>(null);
    const [sql, setSql] = useState<string>('SELECT * FROM public.users LIMIT 10;');
    const [prismaJs, setPrismaJs] = useState<string>('prisma.users.findMany({\n  take: 10\n})');
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [approvalTable, setApprovalTable] = useState<string | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();
    const { editorHeight, startResize, resetEditorHeight, adjustEditorHeight } = useWorkspaceSplitSizing();
    const effectiveSql = injectedSql || sql;
    const effectivePrisma = injectedPrisma || prismaJs;
    const handleRun = () => {
        const queryToRun = activeTab === 'sql' ? effectiveSql : effectivePrisma;

        if (!queryToRun.trim()) return;
        setApprovalTable(null);
        setRunError(null);
        runQuery({ query: queryToRun, mode: activeTab }, {
            onSuccess: (d) => {
                if (d.success) {
                    setTableResults(d.rows);
                    setRunError(null);

                    return;
                }

                if (d.requiresApproval) {
                    setApprovalTable(d.table);

                    return;
                }
                setRunError(d.error || 'Query execution failed.');
            },
            onError: (err) => setRunError(err.message || 'Query execution failed.')
        });
    };

    const handleApprove = () => {
        if (!approvalTable) return;

        allowTable({ table: approvalTable }, {
            onSuccess: () => {
                setApprovalTable(null);
                handleRun();
            }
        });
    };

    const handleEditorValueChange = (code: string) => {
        if (activeTab === 'sql') {
            if (injectedSql) onResetInjected();
            setSql(code);

            return;
        }

        if (injectedPrisma) onResetInjected();
        setPrismaJs(code);
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] flex-1 min-w-0 text-slate-300 font-sans selection:bg-blue-500/30">
            <QueryWorkspaceHeader 
                activeTab={activeTab} onTabChange={onTabChange} onRun={handleRun} 
                isRunning={isRunning} canRun={!!(activeTab === 'sql' ? effectiveSql.trim() : effectivePrisma.trim())} 
            />
            <div ref={splitContainerRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <QueryWorkspaceContent
                    activeTab={activeTab}
                    approvalTable={approvalTable}
                    editorHeight={editorHeight}
                    effectivePrisma={effectivePrisma}
                    effectiveSql={effectiveSql}
                    isAllowing={isAllowing}
                    onAdjustEditorHeight={adjustEditorHeight}
                    onApprove={handleApprove}
                    onClearResults={() => setTableResults(null)}
                    onEditorValueChange={handleEditorValueChange}
                    onResizeEditor={(event) => startResize(event, splitContainerRef.current)}
                    onResetEditorHeight={resetEditorHeight}
                    runError={runError}
                    tableResults={tableResults}
                />
            </div>
            <QueryWorkspaceFooter />
        </div>
    );
}
