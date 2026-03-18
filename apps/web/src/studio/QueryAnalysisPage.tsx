import { useEffect, useMemo, useState } from 'react';
import { QueryAnalysisPageBody } from './QueryAnalysisPageBody';
import { QueryAnalysisPageHeader } from './QueryAnalysisPageHeader';
import { QueryAnalysisEditorPanel } from './QueryAnalysisEditorPanel';
import { loadAiSummaryPreference, saveAiSummaryPreference } from './queryAnalysisPreferences';
import { useAnalyzeQuery, type QueryAnalysisMode, type QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';

interface QueryAnalysisPageProps {
    sql: string;
    injectedSql: string;
    onResetInjected: () => void;
    onSqlChange: (sql: string) => void;
}

export function QueryAnalysisPage({ sql, injectedSql, onResetInjected, onSqlChange }: QueryAnalysisPageProps) {
    const [analysisMode, setAnalysisMode] = useState<QueryAnalysisMode>('explain');
    const [includeAiSummary, setIncludeAiSummary] = useState(() => loadAiSummaryPreference());
    const [analysis, setAnalysis] = useState<QueryAnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const { mutate: analyzeQuery, isPending: isAnalyzing } = useAnalyzeQuery();
    const effectiveSql = injectedSql || sql;

    useEffect(() => {
        saveAiSummaryPreference(includeAiSummary);
    }, [includeAiSummary]);

    const handleAnalyze = () => {
        if (!effectiveSql.trim()) return;

        if (
            analysisMode === 'explain_analyze'
            && !window.confirm('EXPLAIN ANALYZE executes the query. Continue with execution-backed analysis?')
        ) {
            return;
        }

        setAnalysisError(null);
        analyzeQuery({ query: effectiveSql, mode: analysisMode, includeAiSummary }, {
            onSuccess: (result) => {
                setAnalysis(result);
                setSelectedNodeId(result.rawPlan.nodeId);
            },
            onError: (error) => {
                setAnalysis(null);
                setSelectedNodeId(null);
                setAnalysisError(error.message || 'Query analysis failed.');
            }
        });
    };

    const handleEditorValueChange = (value: string) => {
        if (injectedSql) onResetInjected();
        onSqlChange(value);
    };

    const summary = useMemo(() => {
        if (!analysis) return null;

        return [
            { label: 'Findings', value: String(analysis.findings.length) },
            { label: 'Tables', value: String(analysis.referencedTables.length) },
            { label: 'Mode', value: analysis.mode === 'explain_analyze' ? 'Runtime' : 'Planner' }
        ];
    }, [analysis]);

    return (
        <div className="flex h-full min-h-0 flex-col bg-[#101622] text-slate-100">
            <QueryAnalysisPageHeader
                analysisMode={analysisMode}
                canAnalyze={!!effectiveSql.trim()}
                includeAiSummary={includeAiSummary}
                isAnalyzing={isAnalyzing}
                onAnalysisModeChange={setAnalysisMode}
                onAnalyze={handleAnalyze}
                onIncludeAiSummaryChange={setIncludeAiSummary}
                summary={summary}
            />

            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 xl:grid-cols-[260px_minmax(0,0.9fr)_minmax(460px,1.15fr)]">
                <QueryAnalysisPageBody
                    analysis={analysis}
                    analysisError={analysisError}
                    editor={<QueryAnalysisEditorPanel onValueChange={handleEditorValueChange} sql={effectiveSql} />}
                    onSelectNode={setSelectedNodeId}
                    selectedNodeId={selectedNodeId}
                />
            </div>
        </div>
    );
}
