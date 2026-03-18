import { useEffect, useRef, useState } from 'react';
import type { QueryAnalysisMode } from '../api/copilot/useAnalyzeQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { QueryWorkspaceContent } from './QueryWorkspaceContent';
import { QueryWorkspaceFooter } from './QueryWorkspaceFooter';
import { QueryWorkspaceHeader } from './QueryWorkspaceHeader';
import { loadAiSummaryPreference, saveAiSummaryPreference } from './queryAnalysisPreferences';
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
    const [analysisMode, setAnalysisMode] = useState<QueryAnalysisMode>('explain');
    const [includeAiSummary, setIncludeAiSummary] = useState(() => loadAiSummaryPreference());
    const [sql, setSql] = useState<string>('SELECT * FROM public.users LIMIT 10;');
    const [prismaJs, setPrismaJs] = useState<string>('prisma.users.findMany({\n  take: 10\n})');
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();
    const { editorHeight, startResize, resetEditorHeight, adjustEditorHeight } = useWorkspaceSplitSizing();
    const effectiveSql = injectedSql || sql;
    const effectivePrisma = injectedPrisma || prismaJs;
    const queryState = useQueryWorkspaceQueries(activeTab, effectiveSql, effectivePrisma);

    useEffect(() => {
        saveAiSummaryPreference(includeAiSummary);
    }, [includeAiSummary]);

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

    const handleAnalyze = () => {
        if (
            analysisMode === 'explain_analyze'
            && !window.confirm('EXPLAIN ANALYZE executes the query. Continue with execution-backed analysis?')
        ) {
            return;
        }

        queryState.handleAnalyze(analysisMode, includeAiSummary);
    };

    return (
        <div className="flex flex-col h-full flex-1 min-w-0 bg-[#0d1117] font-sans text-slate-300 selection:bg-blue-500/30">
            <QueryWorkspaceHeader
                activeTab={activeTab}
                analysisMode={analysisMode}
                includeAiSummary={includeAiSummary}
                onTabChange={onTabChange}
                onAnalysisModeChange={setAnalysisMode}
                onIncludeAiSummaryChange={setIncludeAiSummary}
                onRun={queryState.handleRun}
                onAnalyze={handleAnalyze}
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
