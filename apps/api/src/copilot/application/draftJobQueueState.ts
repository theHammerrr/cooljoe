import { DraftJobQueueSnapshot } from './draftJobQueueTypes';

export function logDraftJobQueueState(
    enabled: boolean,
    event: string,
    requestId: string | undefined,
    activeCount: number,
    pendingCount: number,
    maxPending: number,
    ownerId: string
) {
    if (!enabled) return;

    console.log(
        `[draftJobQueue] ${event}` +
        (requestId ? ` requestId=${requestId}` : '') +
        ` active=${activeCount} pending=${pendingCount} capacity=${maxPending} owner=${ownerId}`
    );
}

export function buildDraftJobQueueSnapshot(
    ownerId: string,
    activeCount: number,
    pendingCount: number,
    enqueuedCount: number,
    concurrency: number,
    maxPending: number,
    leaseTtlMs: number
): DraftJobQueueSnapshot {
    return { ownerId, activeCount, pendingCount, enqueuedCount, concurrency, maxPending, leaseTtlMs };
}
