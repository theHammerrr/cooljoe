import type { LogicalQueryPlan } from '../queryCompiler/logicalPlanTypes';
import type { QueryAnalysisFinding, QueryAnalysisPlanNode } from '../queryAnalysis/types';

export interface ExplanationResponse {
    explanation: string;
    followUps: string[];
}

export interface QueryAnalysisSummaryResponse {
    summary: string;
    suggestions: string[];
}

export interface QueryAnalysisSummaryInput {
    sql: string;
    findings: QueryAnalysisFinding[];
    rawPlan: QueryAnalysisPlanNode;
    indexes: unknown[];
    tableStats: unknown[];
    safetyNotes: string[];
    schema: unknown;
}

export interface AIProvider {
    generateDraftQuery(question: string, context: Record<string, unknown>): Promise<LogicalQueryPlan>;
    generateChatResponse?(prompt: string, context?: unknown): Promise<string>;
    streamChatResponse?(
        prompt: string,
        context: unknown,
        onChunk: (chunk: string) => void
    ): Promise<string>;
    generateExplanation(question: string, sql: string, dataSample: unknown[], schema: unknown): Promise<ExplanationResponse>;
    generateQueryAnalysisSummary?(input: QueryAnalysisSummaryInput): Promise<QueryAnalysisSummaryResponse>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
