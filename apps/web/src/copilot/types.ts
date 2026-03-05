export type MessageRole = 'user' | 'assistant';

export interface QueryBlock {
    intent: string;
    sql: string;
    prisma?: string;
    riskFlags: string[];
}

export function isQueryBlock(value: unknown): value is QueryBlock {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const intent = Reflect.get(value, 'intent');
    const sql = Reflect.get(value, 'sql');
    const riskFlags = Reflect.get(value, 'riskFlags');

    return (
        typeof intent === 'string' &&
        typeof sql === 'string' &&
        Array.isArray(riskFlags) &&
        riskFlags.every((flag) => typeof flag === 'string')
    );
}

export interface CopilotMessage {
    id: string;
    role: MessageRole;
    text: string;
    queryBlock?: QueryBlock;
    requiresApproval?: boolean;
    tableName?: string;
}
