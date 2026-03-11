import { prisma } from './draftJobStoreClient';
import { toJobRecord, toStatusRecord } from './draftJobStoreMappers';
import { DraftJobRecord, DraftJobStatusRecord, ResumableDraftJobRecord } from './types';

export async function getStatus(requestId: string): Promise<DraftJobStatusRecord | null> {
    const job = await prisma.draftJob.findUnique({ where: { requestId } });

    return job ? toStatusRecord(job) : null;
}

export async function getJob(requestId: string): Promise<DraftJobRecord | null> {
    const job = await prisma.draftJob.findUnique({ where: { requestId } });

    return job ? toJobRecord(job) : null;
}

export async function getResumableJobs(): Promise<ResumableDraftJobRecord[]> {
    const jobs = await prisma.draftJob.findMany({
        where: {
            done: false,
            status: { in: ['pending', 'running'] },
            OR: [
                { leaseOwner: null },
                { leaseExpiresAt: null },
                { leaseExpiresAt: { lt: new Date() } }
            ]
        },
        orderBy: { createdAt: 'asc' }
    });

    return jobs.map((job) => ({
        requestId: job.requestId,
        question: job.question,
        preferredMode: job.preferredMode === 'prisma' ? 'prisma' : 'sql',
        constraints: job.constraints ?? undefined,
        status: job.status
    }));
}

export async function getOperationalSnapshot() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingCount, runningCount, failedCount24h, completedCount24h, recoveredAggregate] = await Promise.all([
        prisma.draftJob.count({ where: { status: 'pending', done: false } }),
        prisma.draftJob.count({ where: { status: 'running', done: false } }),
        prisma.draftJob.count({ where: { status: 'failed', updatedAt: { gte: cutoff } } }),
        prisma.draftJob.count({ where: { status: 'completed', updatedAt: { gte: cutoff } } }),
        prisma.draftJob.aggregate({
            _sum: { recoveryCount: true },
            where: { recoveryCount: { gt: 0 }, updatedAt: { gte: cutoff } }
        })
    ]);

    return {
        pendingCount,
        runningCount,
        failedCount24h,
        completedCount24h,
        recoveredCount24h: recoveredAggregate._sum.recoveryCount ?? 0
    };
}
