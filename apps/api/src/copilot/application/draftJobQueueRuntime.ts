import { draftJobStore } from './DraftJobStore';
import { draftQueryApplicationService } from './draftQueryApplicationService';
import { DraftJobQueueItem } from './draftJobQueueTypes';

interface DraftJobQueueRuntimeInput {
    item: DraftJobQueueItem;
    ownerId: string;
    leaseTtlMs: number;
    onClaimRejected: () => void;
    onStarted: () => void;
    onFinished: () => void;
}

export async function runDraftJobQueueItem(input: DraftJobQueueRuntimeInput): Promise<void> {
    const claimed = await draftJobStore.claimExecutionLease(input.item.requestId, input.ownerId, input.leaseTtlMs);

    if (!claimed) {
        input.onClaimRejected();

        return;
    }

    input.onStarted();
    const renewIntervalId = setInterval(() => {
        void draftJobStore.renewExecutionLease(input.item.requestId, input.ownerId, input.leaseTtlMs);
    }, Math.max(1000, Math.floor(input.leaseTtlMs / 2)));

    try {
        await draftQueryApplicationService.runDraftJob(input.item.command, input.item.requestId, input.item.traceId);
    } catch (error) {
        console.error(`[draftJobQueue] unhandled execution error for ${input.item.requestId}:`, error);
    } finally {
        clearInterval(renewIntervalId);
        await draftJobStore.releaseExecutionLease(input.item.requestId, input.ownerId);
        input.onFinished();
    }
}
