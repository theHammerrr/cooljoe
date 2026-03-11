import { prisma } from './draftJobStoreClient';

export async function claimExecutionLease(requestId: string, owner: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + ttlMs);
    const current = await prisma.draftJob.findUnique({
        where: { requestId },
        select: { done: true, leaseOwner: true, leaseExpiresAt: true }
    });

    if (!current || current.done) return false;
    const updated = await prisma.draftJob.updateMany({
        where: {
            requestId,
            done: false,
            OR: [
                { leaseOwner: null },
                { leaseOwner: owner },
                { leaseExpiresAt: null },
                { leaseExpiresAt: { lt: now } }
            ]
        },
        data: {
            leaseOwner: owner,
            leaseExpiresAt,
            updatedAt: now
        }
    });

    if (updated.count > 0 && current.leaseOwner && current.leaseOwner !== owner && current.leaseExpiresAt && current.leaseExpiresAt < now) {
        console.warn(`[draftJobStore] recovered stale lease requestId=${requestId} previousOwner=${current.leaseOwner} newOwner=${owner}`);
        await prisma.draftJob.updateMany({
            where: { requestId },
            data: {
                recoveryCount: { increment: 1 },
                lastLeaseOwner: current.leaseOwner,
                detail: `Recovered after expired lease from ${current.leaseOwner}.`,
                updatedAt: now
            }
        });
    }

    return updated.count > 0;
}

export async function renewExecutionLease(requestId: string, owner: string, ttlMs: number): Promise<void> {
    const now = new Date();
    await prisma.draftJob.updateMany({
        where: { requestId, done: false, leaseOwner: owner },
        data: {
            leaseExpiresAt: new Date(now.getTime() + ttlMs),
            updatedAt: now
        }
    });
}

export async function releaseExecutionLease(requestId: string, owner: string): Promise<void> {
    await prisma.draftJob.updateMany({
        where: { requestId, leaseOwner: owner },
        data: {
            leaseOwner: null,
            leaseExpiresAt: null,
            updatedAt: new Date()
        }
    });
}
