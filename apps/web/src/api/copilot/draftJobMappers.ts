import type { DraftJobResult } from './useDraftQuery';

export function getDraftJobFromPayload(payload: Record<string, unknown>): DraftJobResult {
    return {
        requestId: String(Reflect.get(payload, 'requestId')),
        status: String(Reflect.get(payload, 'status')),
        stage: String(Reflect.get(payload, 'stage')),
        attempt: typeof Reflect.get(payload, 'attempt') === 'number' ? Number(Reflect.get(payload, 'attempt')) : undefined,
        detail: typeof Reflect.get(payload, 'detail') === 'string' ? String(Reflect.get(payload, 'detail')) : undefined,
        done: Boolean(Reflect.get(payload, 'done')),
        error: typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : undefined,
        updatedAt: Number(Reflect.get(payload, 'updatedAt')),
        question: String(Reflect.get(payload, 'question')),
        preferredMode: String(Reflect.get(payload, 'preferredMode')) === 'prisma' ? 'prisma' : 'sql',
        constraints: typeof Reflect.get(payload, 'constraints') === 'string' ? String(Reflect.get(payload, 'constraints')) : undefined,
        resultStatus: typeof Reflect.get(payload, 'resultStatus') === 'number' ? Number(Reflect.get(payload, 'resultStatus')) : undefined,
        resultPayload: Reflect.get(payload, 'resultPayload'),
        leaseOwner: typeof Reflect.get(payload, 'leaseOwner') === 'string' ? String(Reflect.get(payload, 'leaseOwner')) : undefined,
        leaseExpiresAt: typeof Reflect.get(payload, 'leaseExpiresAt') === 'number' ? Number(Reflect.get(payload, 'leaseExpiresAt')) : undefined,
        recoveryCount: Number(Reflect.get(payload, 'recoveryCount')),
        lastLeaseOwner: typeof Reflect.get(payload, 'lastLeaseOwner') === 'string' ? String(Reflect.get(payload, 'lastLeaseOwner')) : undefined,
        createdAt: Number(Reflect.get(payload, 'createdAt')),
        startedAt: typeof Reflect.get(payload, 'startedAt') === 'number' ? Number(Reflect.get(payload, 'startedAt')) : undefined,
        completedAt: typeof Reflect.get(payload, 'completedAt') === 'number' ? Number(Reflect.get(payload, 'completedAt')) : undefined
    };
}
