import { Prisma } from '@prisma/client';
import { DraftJobRecord, DraftJobStatusRecord } from './types';

export function toStatusRecord(job: {
    requestId: string;
    status: string;
    stage: string;
    attempt: number | null;
    detail: string | null;
    done: boolean;
    error: string | null;
    updatedAt: Date;
}): DraftJobStatusRecord {
    return {
        requestId: job.requestId,
        status: job.status,
        stage: job.stage,
        attempt: job.attempt ?? undefined,
        detail: job.detail ?? undefined,
        done: job.done,
        error: job.error ?? undefined,
        updatedAt: job.updatedAt.getTime()
    };
}

export function toJobRecord(job: {
    requestId: string;
    status: string;
    stage: string;
    attempt: number | null;
    detail: string | null;
    done: boolean;
    error: string | null;
    updatedAt: Date;
    question: string;
    preferredMode: string;
    constraints: string | null;
    resultStatus: number | null;
    resultPayload: unknown;
    leaseOwner: string | null;
    leaseExpiresAt: Date | null;
    recoveryCount: number;
    lastLeaseOwner: string | null;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
}): DraftJobRecord {
    return {
        ...toStatusRecord(job),
        question: job.question,
        preferredMode: job.preferredMode === 'prisma' ? 'prisma' : 'sql',
        constraints: job.constraints ?? undefined,
        resultStatus: typeof job.resultStatus === 'number' ? job.resultStatus : undefined,
        resultPayload: toResultPayload(job.resultPayload),
        leaseOwner: job.leaseOwner ?? undefined,
        leaseExpiresAt: job.leaseExpiresAt?.getTime(),
        recoveryCount: job.recoveryCount,
        lastLeaseOwner: job.lastLeaseOwner ?? undefined,
        createdAt: job.createdAt.getTime(),
        startedAt: job.startedAt?.getTime(),
        completedAt: job.completedAt?.getTime()
    };
}

export function toResultPayload(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

    return Object.fromEntries(Object.entries(value));
}

export function toInputJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value));
}
