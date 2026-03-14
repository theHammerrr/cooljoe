import { QueryWorkspaceEditor } from './QueryWorkspaceEditor';
import { QueryWorkspaceResultsPane } from './QueryWorkspaceResultsPane';
import { QueryWorkspaceSplitHandle } from './QueryWorkspaceSplitHandle';
import type { QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';

interface QueryWorkspaceContentProps {
    activeTab: 'sql' | 'prisma';
    analysisError: string | null;
    analysisResult: QueryAnalysisResult | null;
    approvalTable: string | null;
    editorHeight: number;
    effectivePrisma: string;
    effectiveSql: string;
    isAllowing: boolean;
    onAdjustEditorHeight: (delta: number) => void;
    onApprove: () => void;
    onClearAnalysis: () => void;
    onClearResults: () => void;
    onEditorValueChange: (code: string) => void;
    onResizeEditor: (event: React.MouseEvent<HTMLDivElement>) => void;
    onResetEditorHeight: () => void;
    runError: string | null;
    tableResults: Record<string, unknown>[] | null;
}

export function QueryWorkspaceContent({
    activeTab,
    analysisError,
    analysisResult,
    approvalTable,
    editorHeight,
    effectivePrisma,
    effectiveSql,
    isAllowing,
    onAdjustEditorHeight,
    onApprove,
    onClearAnalysis,
    onClearResults,
    onEditorValueChange,
    onResizeEditor,
    onResetEditorHeight,
    runError,
    tableResults
}: QueryWorkspaceContentProps) {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117] overflow-hidden">
            <QueryWorkspaceEditor
                value={activeTab === 'sql' ? effectiveSql : effectivePrisma}
                onValueChange={onEditorValueChange}
                activeTab={activeTab}
                height={editorHeight}
            />
            <QueryWorkspaceSplitHandle onMouseDown={onResizeEditor} onReset={onResetEditorHeight} onAdjust={onAdjustEditorHeight} />
            <div className="min-h-0 flex-1 bg-[#0d1117] overflow-hidden flex flex-col relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                <div className="flex-1 overflow-hidden p-6 flex flex-col min-h-0">
                    <QueryWorkspaceResultsPane
                        activeTab={activeTab}
                        analysisError={analysisError}
                        analysisResult={analysisResult}
                        approvalTable={approvalTable}
                        isAllowing={isAllowing}
                        onApprove={onApprove}
                        onClearAnalysis={onClearAnalysis}
                        runError={runError}
                        tableResults={tableResults}
                        onClearResults={onClearResults}
                    />
                </div>
            </div>
        </div>
    );
}
