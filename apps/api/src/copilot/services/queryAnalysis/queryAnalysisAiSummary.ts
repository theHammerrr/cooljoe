import { getProvider } from '../llm/providerFactory';
import type { QueryAnalysisResult } from './types';
import type { QueryAnalysisAiSummary } from './queryAnalysisSummaryTypes';

interface BuildQueryAnalysisAiSummaryInput {
    analysis: QueryAnalysisResult;
    sql: string;
    schema: unknown;
}

const DISCLAIMER = 'AI summary may hallucinate or miss database-specific nuance. Validate suggestions against the plan, schema, and workload before acting on them.';
const OPTIMIZATION_DISCLAIMER = 'AI optimization advice may hallucinate, overfit to partial evidence, or recommend changes that are bad for the wider workload. Validate every suggestion against the plan, indexes, schema, and production usage before acting on it.';

export async function buildQueryAnalysisAiSummary(input: BuildQueryAnalysisAiSummaryInput): Promise<QueryAnalysisAiSummary | null> {
    if (process.env.ENABLE_QUERY_ANALYSIS_AI_SUMMARY !== 'true') {
        return null;
    }

    try {
        const provider = getProvider();

        if (!provider.generateQueryAnalysisSummary) {
            return null;
        }

        const summary = await provider.generateQueryAnalysisSummary({
            sql: input.sql,
            findings: input.analysis.findings,
            rawPlan: input.analysis.rawPlan,
            indexes: input.analysis.indexes,
            tableStats: input.analysis.tableStats,
            safetyNotes: input.analysis.safetyNotes,
            schema: input.schema
        });

        return {
            ...summary,
            disclaimer: OPTIMIZATION_DISCLAIMER || DISCLAIMER
        };
    } catch {
        return null;
    }
}
