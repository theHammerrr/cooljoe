import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    isCancelled: vi.fn()
}));

vi.mock('../DraftJobStore', () => ({
    draftJobStore: {
        isCancelled: mocks.isCancelled
    }
}));

import {
    createDraftJobExecutionControl,
    DraftJobCancelledError,
    DraftJobTimeoutError
} from './draftJobExecutionControl';

describe('createDraftJobExecutionControl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-07T00:00:00.000Z'));
    });

    it('throws when the job has been cancelled', async () => {
        mocks.isCancelled.mockResolvedValue(true);

        const control = createDraftJobExecutionControl('draft_1', 1000);

        await expect(control.throwIfStopped('schema load')).rejects.toBeInstanceOf(DraftJobCancelledError);
    });

    it('throws when the runtime budget is exhausted', async () => {
        mocks.isCancelled.mockResolvedValue(false);

        const control = createDraftJobExecutionControl('draft_2', 1000);
        vi.advanceTimersByTime(1001);

        await expect(control.throwIfStopped('llm attempt 1')).rejects.toBeInstanceOf(DraftJobTimeoutError);
    });
});
