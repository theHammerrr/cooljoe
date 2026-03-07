export interface DraftJobStatusRecord {
    requestId: string;
    status: string;
    stage: string;
    attempt?: number;
    detail?: string;
    done: boolean;
    error?: string;
    updatedAt: number;
}

export interface DraftJobRecord extends DraftJobStatusRecord {
    question: string;
    preferredMode: 'sql' | 'prisma';
    constraints?: string;
    resultStatus?: number;
    resultPayload?: Record<string, unknown>;
    leaseOwner?: string;
    leaseExpiresAt?: number;
    recoveryCount: number;
    lastLeaseOwner?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
}

export interface CreateDraftJobInput {
    requestId: string;
    question: string;
    preferredMode: 'sql' | 'prisma';
    constraints?: string;
}

export interface ResumableDraftJobRecord extends CreateDraftJobInput {
    status: string;
}
