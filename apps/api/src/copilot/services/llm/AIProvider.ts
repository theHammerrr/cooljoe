import { SemanticQueryPlan } from '../queryCompiler/types';

export interface AIProvider {
    generateChatResponse?(prompt: string, context?: unknown): Promise<string>;
    generateDraftQuery: (question: string, context: Record<string, unknown>) => Promise<SemanticQueryPlan>;
    generateExplanation: (question: string, query: string, results: unknown[], schema: unknown) => Promise<{
        explanation: string;
        followUps: string[];
    }>;
    generateEmbeddings: (textTokens: string[]) => Promise<number[][]>;
}
