import { buildApiDraftPayload } from '../controllers/draftQuery/buildDraftContext';
import { finishDraftStage, updateDraftStage } from '../controllers/draftQuery/stageTracker';
import { draftJobStore } from './DraftJobStore';
import { DraftQueryApplicationResult } from './draftQueryApplicationService';

export async function persistClarificationResult(requestId: string, payload: Record<string, unknown>): Promise<DraftQueryApplicationResult> {
    await draftJobStore.recordResult(requestId, 200, payload);
    finishDraftStage(requestId);

    return { status: 200, payload };
}

export async function persistSuccessfulDraftResult(
    requestId: string,
    payload: Record<string, unknown>
): Promise<DraftQueryApplicationResult> {
    updateDraftStage(requestId, 'finalizing_draft');
    await draftJobStore.recordResult(requestId, 200, payload);
    finishDraftStage(requestId);

    return { status: 200, payload };
}

export async function persistInvalidDraftResult(
    requestId: string,
    payload: Record<string, unknown>,
    issueMessage: string
): Promise<DraftQueryApplicationResult> {
    await draftJobStore.recordResult(requestId, 422, payload);
    finishDraftStage(requestId, issueMessage);

    return { status: 422, payload };
}

export async function persistRuntimeFailure(
    requestId: string,
    status: number,
    payload: Record<string, unknown>
): Promise<DraftQueryApplicationResult> {
    await draftJobStore.recordResult(requestId, status, payload);
    finishDraftStage(requestId, String(payload.error || 'Draft job failed.'));

    return { status, payload };
}

export function buildCompletedDraftPayload(requestId: string, draft: Parameters<typeof buildApiDraftPayload>[0], sql: string) {
    return { ...buildApiDraftPayload(draft, sql), requestId };
}
