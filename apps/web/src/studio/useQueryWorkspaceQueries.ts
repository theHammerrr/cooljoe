import { useState } from 'react';
import { useRunQuery } from '../api/copilot/useRunQuery';

export function useQueryWorkspaceQueries(activeTab: 'sql' | 'prisma', effectiveSql: string, effectivePrisma: string) {
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [approvalTable, setApprovalTable] = useState<string | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();

    const handleRun = () => {
        const queryToRun = activeTab === 'sql' ? effectiveSql : effectivePrisma;

        if (!queryToRun.trim()) return;
        setApprovalTable(null);
        setRunError(null);
        runQuery({ query: queryToRun, mode: activeTab }, {
            onSuccess: (result) => {
                if (result.success) {
                    setTableResults(result.rows);
                    setRunError(null);

                    return;
                }

                if (result.requiresApproval) {
                    setApprovalTable(result.table);

                    return;
                }

                setRunError(result.error || 'Query execution failed.');
            },
            onError: (error) => setRunError(error.message || 'Query execution failed.')
        });
    };

    return {
        approvalTable,
        handleRun,
        isRunning,
        runError,
        setApprovalTable,
        setTableResults,
        tableResults
    };
}
