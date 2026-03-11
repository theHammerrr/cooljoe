import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
    getSnapshot: vi.fn(),
    getOperationalSnapshot: vi.fn(),
    ensureEventSubscription: vi.fn()
}));

vi.mock('../application/draftJobQueue', () => ({
    draftJobQueue: {
        getSnapshot: mocks.getSnapshot
    }
}));

vi.mock('../application/DraftJobStore', () => ({
    draftJobStore: {
        getOperationalSnapshot: mocks.getOperationalSnapshot,
        ensureEventSubscription: mocks.ensureEventSubscription,
        getResumableJobs: vi.fn().mockResolvedValue([]),
        createJob: vi.fn(),
        recordResult: vi.fn(),
        getJob: vi.fn(),
        getStatus: vi.fn()
    }
}));

describe('GET /api/copilot/ops/draft-jobs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        process.env.NODE_ENV = 'test';
    });

    it('returns live queue and persisted job operational stats', async () => {
        mocks.getSnapshot.mockReturnValue({
            ownerId: 'worker-a',
            activeCount: 1,
            pendingCount: 2,
            enqueuedCount: 3,
            concurrency: 2,
            maxPending: 100,
            leaseTtlMs: 30000
        });
        mocks.getOperationalSnapshot.mockResolvedValue({
            pendingCount: 4,
            runningCount: 1,
            failedCount24h: 2,
            completedCount24h: 8,
            recoveredCount24h: 1
        });

        const { app } = await import('../../index');
        const response = await request(app).get('/api/copilot/ops/draft-jobs');

        expect(response.status).toBe(200);
        expect(response.body.queue.ownerId).toBe('worker-a');
        expect(response.body.queue.pendingCount).toBe(2);
        expect(response.body.jobs.failedCount24h).toBe(2);
        expect(response.body.jobs.recoveredCount24h).toBe(1);
        expect(typeof response.body.generatedAt).toBe('number');
    });
});
