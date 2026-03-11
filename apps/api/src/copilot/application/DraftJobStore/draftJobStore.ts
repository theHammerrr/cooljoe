import { draftJobEventBus } from '../draftJobEventBus';
import { DraftJobEvent } from '../../domain/draftQuery';
import { CreateDraftJobInput, DraftJobRecord, DraftJobStatusRecord, ResumableDraftJobRecord } from './types';
import * as persistence from './draftJobStorePersistence';
import * as readQueries from './draftJobStoreReadQueries';
import * as lease from './draftJobStoreLease';
import { recordDraftJobEvent } from './draftJobStoreEventPersistence';

class DraftJobStore {
    private subscribed = false;

    ensureEventSubscription(): void {
        if (this.subscribed) return;
        this.subscribed = true;
        draftJobEventBus.subscribe((event) => {
            void this.recordEvent(event);
        });
    }

    async createJob(input: CreateDraftJobInput): Promise<void> { return withStoreWarning('createJob', () => persistence.createJob(input)); }
    async markRunning(requestId: string): Promise<boolean> { return withStoreFallback('markRunning', () => persistence.markRunning(requestId), false); }
    async claimExecutionLease(requestId: string, owner: string, ttlMs: number): Promise<boolean> { return withStoreFallback('claimExecutionLease', () => lease.claimExecutionLease(requestId, owner, ttlMs), false); }
    async renewExecutionLease(requestId: string, owner: string, ttlMs: number): Promise<void> { return withStoreWarning('renewExecutionLease', () => lease.renewExecutionLease(requestId, owner, ttlMs)); }
    async releaseExecutionLease(requestId: string, owner: string): Promise<void> { return withStoreWarning('releaseExecutionLease', () => lease.releaseExecutionLease(requestId, owner)); }
    async recordAttempt(requestId: string, attempt: number, sql: string, valid: boolean, issues: string[]): Promise<void> { return withStoreWarning('recordAttempt', () => persistence.recordAttempt(requestId, attempt, sql, valid, issues)); }
    async recordResult(requestId: string, resultStatus: number, resultPayload: Record<string, unknown>): Promise<void> { return withStoreWarning('recordResult', () => persistence.recordResult(requestId, resultStatus, resultPayload)); }
    async cancelJob(requestId: string, reason = 'Draft job cancelled.'): Promise<boolean> { return withStoreFallback('cancelJob', () => persistence.cancelJob(requestId, reason), false); }
    async isCancelled(requestId: string): Promise<boolean> { return withStoreFallback('isCancelled', () => persistence.isCancelled(requestId), false, 'persistence unavailable'); }
    async getStatus(requestId: string): Promise<DraftJobStatusRecord | null> { return withStoreFallback('getStatus', () => readQueries.getStatus(requestId), null, 'persistence unavailable'); }
    async getJob(requestId: string): Promise<DraftJobRecord | null> { return withStoreFallback('getJob', () => readQueries.getJob(requestId), null, 'persistence unavailable'); }
    async getResumableJobs(): Promise<ResumableDraftJobRecord[]> { return withStoreFallback('getResumableJobs', () => readQueries.getResumableJobs(), [], 'persistence unavailable'); }
    async getOperationalSnapshot() { return withStoreFallback('getOperationalSnapshot', () => readQueries.getOperationalSnapshot(), emptyOperationalSnapshot(), 'persistence unavailable'); }
    private async recordEvent(event: DraftJobEvent): Promise<void> { return withStoreWarning('recordEvent', () => recordDraftJobEvent(event)); }
}

async function withStoreWarning(operation: string, run: () => Promise<void>, suffix = 'persistence skipped'): Promise<void> {
    try {
        await run();
    } catch (error) {
        console.warn(`[draftJobStore] ${operation} ${suffix}:`, error);
    }
}

async function withStoreFallback<T>(operation: string, run: () => Promise<T>, fallback: T, suffix = 'persistence skipped'): Promise<T> {
    try {
        return await run();
    } catch (error) {
        console.warn(`[draftJobStore] ${operation} ${suffix}:`, error);

        return fallback;
    }
}

function emptyOperationalSnapshot() {
    return {
        pendingCount: 0,
        runningCount: 0,
        failedCount24h: 0,
        completedCount24h: 0,
        recoveredCount24h: 0
    };
}

export const draftJobStore = new DraftJobStore();
