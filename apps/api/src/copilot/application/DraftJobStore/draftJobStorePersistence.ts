import { prisma } from './draftJobStoreClient';
import { toInputJsonValue } from './draftJobStoreMappers';
import { CreateDraftJobInput } from './types';

export async function createJob(input: CreateDraftJobInput): Promise<void> {
    await prisma.draftJob.upsert({
        where: { requestId: input.requestId },
        create: {
            requestId: input.requestId,
            question: input.question,
            preferredMode: input.preferredMode,
            constraints: input.constraints ?? null,
            status: 'pending',
            stage: 'pending',
            done: false,
            startedAt: null,
            completedAt: null,
            leaseOwner: null,
            leaseExpiresAt: null,
            recoveryCount: 0,
            lastLeaseOwner: null,
            updatedAt: new Date()
        },
        update: {
            question: input.question,
            preferredMode: input.preferredMode,
            constraints: input.constraints ?? null,
            leaseOwner: null,
            leaseExpiresAt: null,
            recoveryCount: 0,
            lastLeaseOwner: null,
            updatedAt: new Date()
        }
    });
}

export async function markRunning(requestId: string): Promise<boolean> {
    const updated = await prisma.draftJob.updateMany({
        where: { requestId, done: false },
        data: {
            status: 'running',
            done: false,
            startedAt: new Date(),
            completedAt: null,
            updatedAt: new Date()
        }
    });

    return updated.count > 0;
}

export async function recordAttempt(requestId: string, attempt: number, sql: string, valid: boolean, issues: string[]): Promise<void> {
    await prisma.draftJobAttempt.create({
        data: { requestId, attempt, sql, valid, issues }
    });
}

export async function recordResult(requestId: string, resultStatus: number, resultPayload: Record<string, unknown>): Promise<void> {
    await prisma.draftJob.updateMany({
        where: { requestId },
        data: {
            resultStatus,
            resultPayload: toInputJsonValue(resultPayload),
            updatedAt: new Date()
        }
    });
}

export async function cancelJob(requestId: string, reason: string): Promise<boolean> {
    const now = new Date();
    const updated = await prisma.draftJob.updateMany({
        where: { requestId, done: false },
        data: {
            status: 'cancelled',
            stage: 'cancelled',
            detail: reason,
            done: true,
            error: reason,
            completedAt: now,
            leaseOwner: null,
            leaseExpiresAt: null,
            updatedAt: now
        }
    });

    return updated.count > 0;
}

export async function isCancelled(requestId: string): Promise<boolean> {
    const job = await prisma.draftJob.findUnique({
        where: { requestId },
        select: { status: true, stage: true, done: true }
    });

    return job?.status === 'cancelled' || job?.stage === 'cancelled' || (job?.done === true && job.status === 'cancelled');
}
