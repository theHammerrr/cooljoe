import { draftJobStore } from './DraftJobStore';
import { DraftJobQueueFullError } from './draftJobQueue';
import { draftJobQueue } from './draftJobQueue';

export async function recoverDraftJobsOnStartup(): Promise<void> {
    const jobs = await draftJobStore.getResumableJobs();

    if (jobs.length === 0) return;

    let enqueued = 0;
    let pendingCount = 0;
    let runningCount = 0;

    for (const job of jobs) {
        if (job.status === 'running') runningCount += 1;
        else pendingCount += 1;
    }

    for (const job of jobs) {
        let accepted = false;

        try {
            accepted = draftJobQueue.enqueue({
                command: {
                    question: job.question,
                    preferred: job.preferredMode,
                    constraints: job.constraints,
                    requestId: job.requestId
                },
                requestId: job.requestId,
                traceId: `resume-${job.requestId.slice(0, 12)}`
            });
        } catch (error) {
            if (error instanceof DraftJobQueueFullError) {
                console.warn('[draftJobRecovery] queue is full during startup recovery; remaining jobs will stay persisted for later recovery.');
                break;
            }

            throw error;
        }

        if (accepted) enqueued += 1;
    }

    console.log(
        `[draftJobRecovery] re-enqueued ${enqueued} draft job(s) from persisted state ` +
        `(pending=${pendingCount} running=${runningCount}).`
    );
}
