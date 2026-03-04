export interface AIProvider {
    generateChatResponse?(prompt: string, context?: unknown): Promise<string>;
    generateDraftQuery: (question: string, context: Record<string, unknown>) => Promise<{
        intent: string;
        assumptions: string[];
        sql: string;
        prisma?: string;
        expectedColumns: string[];
        riskFlags: string[];
    }>;
    generateExplanation: (question: string, query: string, results: unknown[], schema: unknown) => Promise<{
        explanation: string;
        followUps: string[];
    }>;
    generateEmbeddings: (textTokens: string[]) => Promise<number[][]>;
}
