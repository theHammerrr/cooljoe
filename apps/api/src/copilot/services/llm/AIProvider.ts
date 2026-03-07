import { LogicalQueryPlan } from '../queryCompiler/logicalPlanTypes';

export interface AIProvider {
    generateChatResponse?(prompt: string, context?: unknown): Promise<string>;
    generateDraftQuery: (question: string, context: Record<string, unknown>) => Promise<LogicalQueryPlan>;
    generateExplanation: (question: string, query: string, results: unknown[], schema: unknown) => Promise<{
        explanation: string;
        followUps: string[];
    }>;
    generateEmbeddings: (textTokens: string[]) => Promise<number[][]>;
}
