import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    claimExecutionLease: vi.fn(),
    renewExecutionLease: vi.fn(),
    releaseExecutionLease: vi.fn(),
    runDraftJob: vi.fn()
}));

vi.mock('../DraftJobStore', () => ({
    draftJobStore: {
        claimExecutionLease: mocks.claimExecutionLease,
        renewExecutionLease: mocks.renewExecutionLease,
        releaseExecutionLease: mocks.releaseExecutionLease
    }
}));

vi.mock('../draftQueryApplicationService', () => ({
    draftQueryApplicationService: {
        runDraftJob: mocks.runDraftJob
    }
}));

import { DraftJobQueue } from './draftJobQueue';

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('DraftJobQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('skips duplicate enqueues for the same request while work is tracked', async () => {
        mocks.claimExecutionLease.mockResolvedValue(true);
        mocks.runDraftJob.mockResolvedValue(undefined);
        mocks.releaseExecutionLease.mockResolvedValue(undefined);

        const queue = new DraftJobQueue(1, 10, 'worker-a', 30000);
        const command: { question: string; preferred: 'sql'; requestId: string } = {
            question: 'test',
            preferred: 'sql',
            requestId: 'draft_1'
        };
        const item = {
            command,
            requestId: 'draft_1',
            traceId: 'trace-1'
        };

        expect(queue.enqueue(item)).toBe(true);
        expect(queue.enqueue(item)).toBe(false);

        await flushMicrotasks();

        expect(mocks.runDraftJob).toHaveBeenCalledTimes(1);
        expect(mocks.releaseExecutionLease).toHaveBeenCalledWith('draft_1', 'worker-a');
    });

    it('does not run a job when the execution lease cannot be claimed', async () => {
        mocks.claimExecutionLease.mockResolvedValue(false);

        const queue = new DraftJobQueue(1, 10, 'worker-b', 30000);
        const command: { question: string; preferred: 'sql'; requestId: string } = {
            question: 'test',
            preferred: 'sql',
            requestId: 'draft_2'
        };

        expect(queue.enqueue({
            command,
            requestId: 'draft_2',
            traceId: 'trace-2'
        })).toBe(true);

        await flushMicrotasks();

        expect(mocks.runDraftJob).not.toHaveBeenCalled();
        expect(mocks.releaseExecutionLease).not.toHaveBeenCalled();
    });
});
