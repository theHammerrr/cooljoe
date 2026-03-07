import { randomUUID } from 'node:crypto';
import { readDraftJobQueueConfig } from './draftJobQueueConfig';
import { DraftJobQueueFullError, DraftJobQueueItem, DraftJobQueueSnapshot } from './draftJobQueueTypes';
import { runDraftJobQueueItem } from './draftJobQueueRuntime';
import { buildDraftJobQueueSnapshot, logDraftJobQueueState } from './draftJobQueueState';

export class DraftJobQueue {
    private readonly pending: DraftJobQueueItem[] = [];
    private readonly enqueuedRequestIds = new Set<string>();
    private activeCount = 0;
    private readonly concurrency: number;
    private readonly maxPending: number;
    private readonly ownerId: string;
    private readonly leaseTtlMs: number;
    private readonly debugLogsEnabled: boolean;

    constructor(concurrency = 2, maxPending = 100, ownerId: string = randomUUID(), leaseTtlMs = 30000, debugLogsEnabled = false) {
        this.concurrency = concurrency;
        this.maxPending = maxPending;
        this.ownerId = String(ownerId);
        this.leaseTtlMs = leaseTtlMs;
        this.debugLogsEnabled = debugLogsEnabled;
    }

    private logState(event: string, requestId?: string): void {
        logDraftJobQueueState(this.debugLogsEnabled, event, requestId, this.activeCount, this.pending.length, this.maxPending, this.ownerId);
    }

    getSnapshot(): DraftJobQueueSnapshot {
        return buildDraftJobQueueSnapshot(this.ownerId, this.activeCount, this.pending.length, this.enqueuedRequestIds.size, this.concurrency, this.maxPending, this.leaseTtlMs);
    }

    enqueue(item: DraftJobQueueItem): boolean {
        if (this.enqueuedRequestIds.has(item.requestId)) {
            this.logState('skip-duplicate-enqueue', item.requestId);

            return false;
        }

        if (this.pending.length >= this.maxPending) {
            this.logState('queue-full', item.requestId);
            throw new DraftJobQueueFullError();
        }

        this.pending.push(item);
        this.enqueuedRequestIds.add(item.requestId);
        this.logState('enqueued', item.requestId);
        this.processNext();

        return true;
    }

    private processNext(): void {
        while (this.activeCount < this.concurrency && this.pending.length > 0) {
            const next = this.pending.shift();

            if (!next) return;

            this.activeCount += 1;
            void this.run(next);
        }
    }

    private async run(item: DraftJobQueueItem): Promise<void> {
        await runDraftJobQueueItem({
            item,
            ownerId: this.ownerId,
            leaseTtlMs: this.leaseTtlMs,
            onClaimRejected: () => {
                this.logState('claim-rejected', item.requestId);
                this.activeCount -= 1;
                this.enqueuedRequestIds.delete(item.requestId);
                this.processNext();
            },
            onStarted: () => {
                this.logState('started', item.requestId);
            },
            onFinished: () => {
                this.logState('finished', item.requestId);
            }
        });

        if (this.enqueuedRequestIds.has(item.requestId)) {
            this.activeCount -= 1;
            this.enqueuedRequestIds.delete(item.requestId);
            this.processNext();
        }
    }
}

export { DraftJobQueueFullError };
export type { DraftJobQueueSnapshot };

const queueConfig = readDraftJobQueueConfig();

export const draftJobQueue = new DraftJobQueue(queueConfig.concurrency, queueConfig.maxPending, queueConfig.ownerId, queueConfig.leaseTtlMs, queueConfig.debugLogsEnabled);
