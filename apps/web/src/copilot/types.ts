export type MessageRole = 'user' | 'assistant';

export interface CopilotMessage {
    id: string;
    role: MessageRole;
    text: string;
    queryBlock?: {
        intent: string;
        sql: string;
        prisma?: string;
        riskFlags: string[];
    };
}
