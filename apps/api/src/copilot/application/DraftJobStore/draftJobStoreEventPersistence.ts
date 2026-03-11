import { prisma } from './draftJobStoreClient';
import { DraftJobEvent } from '../../domain/draftQuery';

export async function recordDraftJobEvent(event: DraftJobEvent): Promise<void> {
    const done = event.type === 'draft.completed' || event.type === 'draft.failed' || event.type === 'draft.cancelled';
    const newStage = done ? (event.type === 'draft.failed' ? 'failed' : event.type === 'draft.cancelled' ? 'cancelled' : 'completed') : event.stage;
    const newStatus = done ? (event.type === 'draft.failed' ? 'failed' : event.type === 'draft.cancelled' ? 'cancelled' : 'completed') : 'running';

    await prisma.$transaction([
        prisma.draftJobEvent.create({
            data: {
                requestId: event.requestId,
                type: event.type,
                stage: event.stage,
                attempt: event.attempt ?? null,
                detail: event.detail ?? null,
                error: event.error ?? null,
                occurredAt: new Date(event.occurredAt)
            }
        }),
        prisma.draftJob.updateMany({
            where: { requestId: event.requestId },
            data: {
                status: newStatus,
                stage: newStage,
                attempt: event.attempt ?? null,
                detail: event.detail ?? null,
                done,
                error: event.error ?? null,
                completedAt: done ? new Date(event.occurredAt) : null,
                updatedAt: new Date()
            }
        })
    ]);
}
