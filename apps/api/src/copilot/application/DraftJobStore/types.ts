export interface DraftJobStatusRecord {
    requestId: string;
    stage: string;
    attempt?: number;
    detail?: string;
    done: boolean;
    error?: string;
    updatedAt: number;
}

export interface CreateDraftJobInput {
    requestId: string;
    question: string;
    preferredMode: 'sql' | 'prisma';
    constraints?: string;
}