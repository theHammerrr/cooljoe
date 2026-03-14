import type { QueryAnalysisResult } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisAiSummaryInputsProps {
    analysis: QueryAnalysisResult;
}

export function QueryAnalysisAiSummaryInputs({ analysis }: QueryAnalysisAiSummaryInputsProps) {
    const preview = {
        mode: analysis.mode,
        referencedTables: analysis.referencedTables,
        safetyNotes: analysis.safetyNotes,
        findingTitles: analysis.findings.map((finding) => finding.title),
        indexes: analysis.indexes.map((index) => ({
            table: `${index.schemaName}.${index.tableName}`,
            indexName: index.indexName,
            columns: index.columns
        })),
        tableStats: analysis.tableStats,
        rootPlan: {
            nodeId: analysis.rawPlan.nodeId,
            nodeType: analysis.rawPlan.nodeType,
            planRows: analysis.rawPlan.planRows,
            actualRows: analysis.rawPlan.actualRows,
            actualTotalTime: analysis.rawPlan.actualTotalTime
        },
        normalizedSql: analysis.normalizedSql
    };

    return (
        <details className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3">
            <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.18em] text-amber-100/80">
                Why The Model Said This
            </summary>
            <p className="mt-3 text-sm text-amber-50/75">
                This is the structured analysis context passed into the AI optimization summary.
            </p>
            <pre className="mt-3 overflow-auto rounded-lg border border-white/5 bg-black/30 p-3 text-xs text-slate-300">
                <code>{JSON.stringify(preview, null, 2)}</code>
            </pre>
        </details>
    );
}
