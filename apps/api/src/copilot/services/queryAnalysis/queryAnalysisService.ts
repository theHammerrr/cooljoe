import type { QueryAnalysisResult } from './types';
import { extractReferencedTablesFromQuery } from '../../safety/queryValidator';
import { loadExplainPlan, loadIndexMetadata } from './queryAnalysisData';
import { buildAnalysisFindings } from './queryAnalysisFindings';

export async function analyzeQuery(safeSql: string): Promise<QueryAnalysisResult> {
    const referencedTables = extractReferencedTablesFromQuery(safeSql);
    const [rawPlan, indexes] = await Promise.all([
        loadExplainPlan(safeSql),
        loadIndexMetadata(referencedTables)
    ]);
    const findings = buildAnalysisFindings(safeSql, rawPlan, indexes);

    return {
        mode: 'explain',
        normalizedSql: safeSql,
        referencedTables,
        indexes,
        findings,
        rawPlan
    };
}
