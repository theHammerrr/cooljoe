import { useState } from 'react';
import { useAnalyzeQuery, type QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';
import { useRunQuery } from '../api/copilot/useRunQuery';

export function useQueryWorkspaceQueries(activeTab: 'sql' | 'prisma', effectiveSql: string, effectivePrisma: string) {
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [analysisResult, setAnalysisResult] = useState<QueryAnalysisResult | null>(null);
    const [approvalTable, setApprovalTable] = useState<string | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: analyzeQuery, isPending: isAnalyzing } = useAnalyzeQuery();

    const handleRun = () => {
        const queryToRun = activeTab === 'sql' ? effectiveSql : effectivePrisma;

        if (!queryToRun.trim()) return;
        setApprovalTable(null);
        setRunError(null);
        setAnalysisError(null);
        runQuery({ query: queryToRun, mode: activeTab }, {
            onSuccess: (result) => {
                if (result.success) {
                    setTableResults(result.rows);
                    setAnalysisResult(null);
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

    const handleAnalyze = () => {
        if (activeTab !== 'sql' || !effectiveSql.trim()) return;
        setApprovalTable(null);
        setRunError(null);
        setAnalysisError(null);
        analyzeQuery({ query: effectiveSql, mode: 'explain' }, {
            onSuccess: (result) => {
                setTableResults(null);
                setAnalysisResult(result);
            },
            onError: (error) => {
                setAnalysisResult(null);
                setAnalysisError(error.message || 'Query analysis failed.');
            }
        });
    };

    return {
        analysisError,
        analysisResult,
        approvalTable,
        handleAnalyze,
        handleRun,
        isAnalyzing,
        isRunning,
        runError,
        setAnalysisError,
        setAnalysisResult,
        setApprovalTable,
        setTableResults,
        tableResults
    };
}
