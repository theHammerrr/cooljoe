export type MessageRole = 'user' | 'assistant';

export interface QueryBlock {
    intent: string;
    sql: string;
    prisma?: string;
    riskFlags: string[];
}

export interface ClarificationPayload {
    type: 'clarification_required';
    message: string;
    missing: string[];
}

export function isClarificationPayload(value: unknown): value is ClarificationPayload {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    return (
        Reflect.get(value, 'type') === 'clarification_required' &&
        typeof Reflect.get(value, 'message') === 'string' &&
        Array.isArray(Reflect.get(value, 'missing')) &&
        Reflect.get(value, 'missing').every((item: unknown) => typeof item === 'string')
    );
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
    mode?: 'chat' | 'sql' | 'prisma';
    retryDraft?: {
        question: string;
        mode: 'sql' | 'prisma';
        constraints: string;
    };
    suggestedDraft?: {
        question: string;
        mode: 'sql' | 'prisma';
        reason?: string;
        constraints?: string;
        ctaLabel?: string;
    };
    runError?: string;
}
