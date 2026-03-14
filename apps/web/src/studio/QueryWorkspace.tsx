import { useRef, useState } from 'react';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { QueryWorkspaceContent } from './QueryWorkspaceContent';
import { QueryWorkspaceFooter } from './QueryWorkspaceFooter';
import { QueryWorkspaceHeader } from './QueryWorkspaceHeader';
import { useQueryWorkspaceQueries } from './useQueryWorkspaceQueries';
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
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();
    const { editorHeight, startResize, resetEditorHeight, adjustEditorHeight } = useWorkspaceSplitSizing();
    const effectiveSql = injectedSql || sql;
    const effectivePrisma = injectedPrisma || prismaJs;
    const queryState = useQueryWorkspaceQueries(activeTab, effectiveSql, effectivePrisma);

    const handleApprove = () => {
        if (!queryState.approvalTable) return;

        allowTable({ table: queryState.approvalTable }, {
            onSuccess: () => {
                queryState.setApprovalTable(null);
                queryState.handleRun();
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
        <div className="flex flex-col h-full flex-1 min-w-0 bg-[#0d1117] font-sans text-slate-300 selection:bg-blue-500/30">
            <QueryWorkspaceHeader
                activeTab={activeTab}
                onTabChange={onTabChange}
                onRun={queryState.handleRun}
                onAnalyze={queryState.handleAnalyze}
                isRunning={queryState.isRunning}
                isAnalyzing={queryState.isAnalyzing}
                canRun={!!(activeTab === 'sql' ? effectiveSql.trim() : effectivePrisma.trim())}
                canAnalyze={activeTab === 'sql' && !!effectiveSql.trim()}
            />
            <div ref={splitContainerRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <QueryWorkspaceContent
                    activeTab={activeTab}
                    analysisError={queryState.analysisError}
                    analysisResult={queryState.analysisResult}
                    approvalTable={queryState.approvalTable}
                    editorHeight={editorHeight}
                    effectivePrisma={effectivePrisma}
                    effectiveSql={effectiveSql}
                    isAllowing={isAllowing}
                    onAdjustEditorHeight={adjustEditorHeight}
                    onApprove={handleApprove}
                    onClearAnalysis={() => { queryState.setAnalysisResult(null); queryState.setAnalysisError(null); }}
                    onClearResults={() => queryState.setTableResults(null)}
                    onEditorValueChange={handleEditorValueChange}
                    onResizeEditor={(event) => startResize(event, splitContainerRef.current)}
                    onResetEditorHeight={resetEditorHeight}
                    runError={queryState.runError}
                    tableResults={queryState.tableResults}
                />
            </div>
            <QueryWorkspaceFooter />
        </div>
    );
}
