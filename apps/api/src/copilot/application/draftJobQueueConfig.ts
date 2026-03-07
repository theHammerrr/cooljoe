import { randomUUID } from 'node:crypto';

function readPositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;

    return parsed;
}

function readBooleanFlag(value: string | undefined): boolean {
    return value === '1' || value?.toLowerCase() === 'true';
}

export function readDraftJobQueueConfig() {
    return {
        concurrency: readPositiveInt(process.env.DRAFT_JOB_QUEUE_CONCURRENCY, 2),
        maxPending: readPositiveInt(process.env.DRAFT_JOB_QUEUE_MAX_PENDING, 100),
        ownerId: process.env.DRAFT_JOB_QUEUE_OWNER_ID || `${process.pid}-${randomUUID()}`,
        leaseTtlMs: readPositiveInt(process.env.DRAFT_JOB_LEASE_TTL_MS, 30000),
        debugLogsEnabled: readBooleanFlag(process.env.DRAFT_JOB_DEBUG_LOGS)
    };
}
