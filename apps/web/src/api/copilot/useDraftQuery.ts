import { API_BASE_URL } from './apiClient';
import { getDraftJobFromPayload } from './draftJobMappers';
import { isDraftJobBasePayload } from './draftJobPayload';
import type { DraftJobPayload } from './draftJobPayloadTypes';

interface CreateDraftJobParams {
    question: string;
    preferred?: 'sql' | 'prisma';
    constraints?: string;
}

export interface DraftQueryToken {
    requestId: string;
    statusToken: string;
    expiresAt: number;
}

export interface DraftJobResult {
    requestId: string;
    status: string;
    stage: string;
    attempt?: number;
    detail?: string;
    done: boolean;
    error?: string;
    updatedAt: number;
    question: string;
    preferredMode: 'sql' | 'prisma';
    constraints?: string;
    resultStatus?: number;
    resultPayload?: DraftJobPayload;
    leaseOwner?: string;
    leaseExpiresAt?: number;
    recoveryCount: number;
    lastLeaseOwner?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
}

export class DraftQueryApiError extends Error {
    issues?: string[];
    draft?: unknown;
}

export async function createDraftJob(params: CreateDraftJobParams): Promise<DraftQueryToken> {
    const response = await fetch(`${API_BASE_URL}/api/copilot/draft-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : 'Failed to create draft job');
    }

    if (
        typeof Reflect.get(payload, 'requestId') !== 'string' ||
        typeof Reflect.get(payload, 'statusToken') !== 'string' ||
        typeof Reflect.get(payload, 'expiresAt') !== 'number'
    ) {
        throw new Error('Invalid draft token payload');
    }

    return {
        requestId: String(Reflect.get(payload, 'requestId')),
        statusToken: String(Reflect.get(payload, 'statusToken')),
        expiresAt: Number(Reflect.get(payload, 'expiresAt'))
    };
}

export async function getDraftJob(requestId: string, statusToken: string): Promise<DraftJobResult> {
    const response = await fetch(`${API_BASE_URL}/api/copilot/draft-jobs/${encodeURIComponent(requestId)}?token=${encodeURIComponent(statusToken)}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : 'Failed to load draft job');
    }

    if (!isDraftJobBasePayload(payload)) {
        throw new Error('Invalid draft job payload');
    }

    return getDraftJobFromPayload(payload);
}

export async function cancelDraftJob(requestId: string, statusToken: string): Promise<DraftJobResult> {
    const response = await fetch(
        `${API_BASE_URL}/api/copilot/draft-jobs/${encodeURIComponent(requestId)}/cancel?token=${encodeURIComponent(statusToken)}`,
        { method: 'POST' }
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : 'Failed to cancel draft job');
    }

    if (!isDraftJobBasePayload(payload)) {
        throw new Error('Invalid draft job payload');
    }

    return getDraftJobFromPayload(payload);
}
