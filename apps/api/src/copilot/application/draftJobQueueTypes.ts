import { DraftQueryCommand } from '../domain/draftQuery';

export interface DraftJobQueueItem {
    command: DraftQueryCommand;
    requestId: string;
    traceId: string;
}

export interface DraftJobQueueSnapshot {
    ownerId: string;
    activeCount: number;
    pendingCount: number;
    enqueuedCount: number;
    concurrency: number;
    maxPending: number;
    leaseTtlMs: number;
}

export class DraftJobQueueFullError extends Error {
    constructor() {
        super('Draft job queue is full. Please retry shortly.');
        this.name = 'DraftJobQueueFullError';
    }
}
