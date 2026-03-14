import type { QueryAnalysisMode, QueryAnalysisResult } from './types';
import { extractReferencedTablesFromQuery } from '../../safety/queryValidator';
import { loadExplainPlan, loadIndexMetadata, loadTableStats } from './queryAnalysisData';
import { buildAnalysisFindings } from './queryAnalysisFindings';

export async function analyzeQuery(safeSql: string, mode: QueryAnalysisMode = 'explain'): Promise<QueryAnalysisResult> {
    const referencedTables = extractReferencedTablesFromQuery(safeSql);
    const [rawPlan, indexes, tableStats] = await Promise.all([
        loadExplainPlan(safeSql, mode),
        loadIndexMetadata(referencedTables),
        loadTableStats(referencedTables)
    ]);
    const findings = buildAnalysisFindings(safeSql, rawPlan, indexes, tableStats, mode);

    return {
        mode,
        normalizedSql: safeSql,
        referencedTables,
        indexes,
        tableStats,
        safetyNotes: mode === 'explain_analyze'
            ? ['EXPLAIN ANALYZE executes the query and reports actual runtime metrics.']
            : [],
        findings,
        rawPlan
    };
}
