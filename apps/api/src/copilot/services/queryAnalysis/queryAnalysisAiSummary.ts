import { getProvider } from '../llm/providerFactory';
import type { QueryAnalysisResult } from './types';
import type { QueryAnalysisAiSummary } from './queryAnalysisSummaryTypes';

interface BuildQueryAnalysisAiSummaryInput {
    analysis: QueryAnalysisResult;
    sql: string;
    schema: unknown;
}

const DISCLAIMER = 'AI summary may hallucinate or miss database-specific nuance. Validate suggestions against the plan, schema, and workload before acting on them.';

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
            schema: input.schema
        });

        return {
            ...summary,
            disclaimer: DISCLAIMER
        };
    } catch {
        return null;
    }
}
