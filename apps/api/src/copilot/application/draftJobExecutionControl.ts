import { draftJobStore } from './DraftJobStore';

export class DraftJobCancelledError extends Error {
    constructor(message = 'Draft job cancelled by client.') {
        super(message);
        this.name = 'DraftJobCancelledError';
    }
}

export class DraftJobTimeoutError extends Error {
    constructor(message = 'Draft job exceeded the allowed execution time.') {
        super(message);
        this.name = 'DraftJobTimeoutError';
    }
}

interface DraftJobExecutionControl {
    throwIfStopped(checkpoint: string): Promise<void>;
}

export function createDraftJobExecutionControl(
    requestId: string,
    maxRuntimeMs = readPositiveInt(process.env.DRAFT_JOB_MAX_RUNTIME_MS, 120000)
): DraftJobExecutionControl {
    const startedAt = Date.now();
    const deadline = startedAt + maxRuntimeMs;

    return {
        async throwIfStopped(checkpoint: string): Promise<void> {
            if (await draftJobStore.isCancelled(requestId)) {
                throw new DraftJobCancelledError(`Draft job cancelled by client before ${checkpoint}.`);
            }

            if (Date.now() > deadline) {
                throw new DraftJobTimeoutError(`Draft job exceeded ${maxRuntimeMs}ms before ${checkpoint}.`);
            }
        }
    };
}

function readPositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

    return Math.floor(parsed);
}
