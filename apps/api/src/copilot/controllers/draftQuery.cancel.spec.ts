import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    verifyDraftStatusToken: vi.fn(),
    getJob: vi.fn(),
    cancelJob: vi.fn(),
    ensureEventSubscription: vi.fn(),
    cancelDraftStage: vi.fn()
}));

vi.mock('../domain/draftQueryToken', () => ({
    verifyDraftStatusToken: mocks.verifyDraftStatusToken,
    issueDraftStatusToken: vi.fn()
}));

vi.mock('../application/DraftJobStore', () => ({
    draftJobStore: {
        ensureEventSubscription: mocks.ensureEventSubscription,
        getJob: mocks.getJob,
        cancelJob: mocks.cancelJob
    }
}));

vi.mock('./draftQuery/stageTracker', async () => {
    const actual = await vi.importActual<typeof import('./draftQuery/stageTracker')>('./draftQuery/stageTracker');

    return {
        ...actual,
        cancelDraftStage: mocks.cancelDraftStage
    };
});

vi.mock('../application/draftJobQueue', () => ({
    DraftJobQueueFullError: class DraftJobQueueFullError extends Error {},
    draftJobQueue: { enqueue: vi.fn() }
}));

vi.mock('../application/draftQueryApplicationService', () => ({
    draftQueryApplicationService: { runDraftJob: vi.fn() }
}));

vi.mock('../application/draftJobEventBus', () => ({
    draftJobEventBus: { subscribe: vi.fn(() => () => undefined) }
}));

import { cancelDraftJob } from './draftQuery';

function createResponse() {
    const response = {
        status: vi.fn(),
        json: vi.fn()
    };

    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);

    return response;
}

describe('cancelDraftJob', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.verifyDraftStatusToken.mockReturnValue(true);
    });

    it('marks an in-flight job as cancelled and publishes a cancellation stage', async () => {
        const job = {
            requestId: 'draft_1',
            status: 'cancelled',
            stage: 'cancelled',
            done: true,
            updatedAt: Date.now(),
            question: 'q',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now()
        };
        mocks.getJob.mockResolvedValueOnce({
            ...job,
            status: 'running',
            stage: 'planning_with_llm',
            done: false
        }).mockResolvedValueOnce(job);
        mocks.cancelJob.mockResolvedValue(true);

        const req = {
            params: { requestId: 'draft_1' },
            query: { token: 'token_1' }
        };
        const res = createResponse();

        await Reflect.apply(cancelDraftJob, undefined, [req, res]);

        expect(mocks.cancelJob).toHaveBeenCalledWith('draft_1', 'Draft job cancelled by client.');
        expect(mocks.cancelDraftStage).toHaveBeenCalledWith('draft_1', 'Draft job cancelled by client.');
        expect(res.status).toHaveBeenCalledWith(202);
        expect(res.json).toHaveBeenCalledWith(job);
    });

    it('rejects cancelling a finished job', async () => {
        mocks.getJob.mockResolvedValue({
            requestId: 'draft_2',
            status: 'completed',
            stage: 'completed',
            done: true,
            updatedAt: Date.now(),
            question: 'q',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now()
        });

        const req = {
            params: { requestId: 'draft_2' },
            query: { token: 'token_2' }
        };
        const res = createResponse();

        await Reflect.apply(cancelDraftJob, undefined, [req, res]);

        expect(mocks.cancelJob).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });
});
