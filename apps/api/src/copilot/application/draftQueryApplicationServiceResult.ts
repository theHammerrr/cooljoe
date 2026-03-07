import { SemanticQueryPlan } from '../services/queryCompiler/types';
import { finishDraftStage, updateDraftStage } from '../controllers/draftQuery/stageTracker';
import { draftJobStore } from './DraftJobStore';
import { DraftQueryApplicationResult } from './draftQueryApplicationService';
import {
    buildClarificationDraftResultPayload,
    buildQueryDraftResultPayload,
    buildRuntimeErrorDraftResultPayload,
    buildValidationErrorDraftResultPayload
} from './draftJobResultPayload';

function readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is string => typeof item === 'string');
}

export async function persistClarificationResult(requestId: string, payload: Record<string, unknown>): Promise<DraftQueryApplicationResult> {
    await draftJobStore.recordResult(
        requestId,
        200,
        buildClarificationDraftResultPayload({
            type: 'clarification_required',
            message: typeof payload.message === 'string' ? payload.message : 'I need more detail before I can draft a safe query.',
            missing: readStringArray(payload.missing),
            intentSketch: payload.intentSketch
        })
    );
    finishDraftStage(requestId);

    return { status: 200, payload };
}

export async function persistSuccessfulDraftResult(
    requestId: string,
    payload: Record<string, unknown>
): Promise<DraftQueryApplicationResult> {
    updateDraftStage(requestId, 'finalizing_draft');
    await draftJobStore.recordResult(requestId, 200, { kind: 'query', query: payload });
    finishDraftStage(requestId);

    return { status: 200, payload };
}

export async function persistInvalidDraftResult(
    requestId: string,
    payload: Record<string, unknown>,
    issueMessage: string
): Promise<DraftQueryApplicationResult> {
    await draftJobStore.recordResult(
        requestId,
        422,
        buildValidationErrorDraftResultPayload({
            error: String(payload.error || 'Generated SQL failed schema validation.'),
            issues: readStringArray(payload.issues),
            diagnostics: Array.isArray(payload.diagnostics) ? payload.diagnostics : [],
            draft: payload.draft && typeof payload.draft === 'object' && !Array.isArray(payload.draft)
                ? Object.fromEntries(Object.entries(payload.draft))
                : undefined
        })
    );
    finishDraftStage(requestId, issueMessage);

    return { status: 422, payload };
}

export async function persistRuntimeFailure(
    requestId: string,
    status: number,
    payload: Record<string, unknown>
): Promise<DraftQueryApplicationResult> {
    await draftJobStore.recordResult(
        requestId,
        status,
        buildRuntimeErrorDraftResultPayload(String(payload.error || 'Draft job failed.'), payload)
    );
    finishDraftStage(requestId, String(payload.error || 'Draft job failed.'));

    return { status, payload };
}

export function buildCompletedDraftPayload(requestId: string, draft: SemanticQueryPlan, sql: string) {
    return buildQueryDraftResultPayload(requestId, draft, sql).query;
}
