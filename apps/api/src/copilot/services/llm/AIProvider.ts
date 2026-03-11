import type { LogicalQueryPlan } from '../queryCompiler/logicalPlanTypes';

export interface ExplanationResponse {
    explanation: string;
    followUps: string[];
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
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
