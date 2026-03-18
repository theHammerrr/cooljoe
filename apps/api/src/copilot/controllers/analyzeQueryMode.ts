import type { QueryAnalysisMode } from '../services/queryAnalysis/types';

export function assertAnalyzeQueryModeAllowed(mode: QueryAnalysisMode): void {
    if (mode !== 'explain_analyze') {
        return;
    }

    if (process.env.ENABLE_QUERY_ANALYZE_EXECUTION === 'true') {
        return;
    }

    throw new Error('EXPLAIN ANALYZE is disabled on this server. Set ENABLE_QUERY_ANALYZE_EXECUTION=true to allow execution-backed query analysis.');
}
