import { ResultsTable } from '../copilot/ResultsTable';
import { QueryWorkspaceApproval } from './QueryWorkspaceApproval';
import { QueryWorkspaceEmptyState } from './QueryWorkspaceEmptyState';

interface QueryWorkspaceResultsPaneProps {
    activeTab: 'sql' | 'prisma';
    approvalTable: string | null;
    isAllowing: boolean;
    onApprove: () => void;
    runError: string | null;
    tableResults: Record<string, unknown>[] | null;
    onClearResults: () => void;
}

export function QueryWorkspaceResultsPane({
    activeTab,
    approvalTable,
    isAllowing,
    onApprove,
    runError,
    tableResults,
    onClearResults
}: QueryWorkspaceResultsPaneProps) {
    if (approvalTable) {
        return (
            <div className="my-auto animate-in fade-in zoom-in-95 duration-700">
                <QueryWorkspaceApproval approvalTable={approvalTable} isAllowing={isAllowing} onApprove={onApprove} />
            </div>
        );
    }

    if (tableResults) {
        return (
            <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
                {runError && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                        {runError}
                    </div>
                )}
                <div className="min-h-0 flex-1 overflow-hidden">
                    <ResultsTable tableResults={tableResults} onClear={onClearResults} />
                </div>
            </div>
        );
    }

    if (runError) {
        return (
            <div className="my-auto rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                {runError}
            </div>
        );
    }

    return <QueryWorkspaceEmptyState activeTab={activeTab} />;
}
