import { draftJobEventBus } from '../../application/draftJobEventBus';
import { DraftJobEvent, DraftJobStage } from '../../domain/draftQuery';

interface DraftStageState {
    requestId: string;
    stage: DraftJobStage;
    attempt?: number;
    detail?: string;
    done: boolean;
    error?: string;
    updatedAt: number;
}

const statusMap = new Map<string, DraftStageState>();
const TTL_MS = 10 * 60 * 1000;

function now(): number {
    return Date.now();
}

function cleanupExpired(): void {
    const cutoff = now() - TTL_MS;

    for (const [key, value] of statusMap.entries()) {
        if (value.updatedAt < cutoff) statusMap.delete(key);
    }
}

function applyEvent(event: DraftJobEvent): void {
    cleanupExpired();
    const prev = statusMap.get(event.requestId);

    if (event.type === 'draft.completed' || event.type === 'draft.failed' || event.type === 'draft.cancelled') {
        statusMap.set(event.requestId, {
            requestId: event.requestId,
            stage: event.type === 'draft.failed' ? 'failed' : event.type === 'draft.cancelled' ? 'cancelled' : 'completed',
            attempt: prev?.attempt,
            detail: event.detail ?? prev?.detail,
            done: true,
            error: event.error,
            updatedAt: event.occurredAt
        });

        return;
    }

    statusMap.set(event.requestId, {
        requestId: event.requestId,
        stage: event.stage,
        attempt: event.attempt,
        detail: event.detail,
        done: false,
        updatedAt: event.occurredAt,
        error: prev?.error
    });
}

draftJobEventBus.subscribe(applyEvent);

export function startDraftStage(requestId: string, stage: DraftJobStage): void {
    draftJobEventBus.publish({
        type: 'draft.started',
        requestId,
        stage,
        occurredAt: now()
    });
}

export function updateDraftStage(requestId: string, stage: DraftJobStage, attempt?: number, detail?: string): void {
    draftJobEventBus.publish({
        type: 'draft.progressed',
        requestId,
        stage,
        attempt,
        detail,
        occurredAt: now()
    });
}

export function finishDraftStage(requestId: string, error?: string): void {
    draftJobEventBus.publish({
        type: error ? 'draft.failed' : 'draft.completed',
        requestId,
        stage: error ? 'failed' : 'completed',
        error,
        occurredAt: now()
    });
}

export function cancelDraftStage(requestId: string, detail = 'Draft job cancelled.'): void {
    draftJobEventBus.publish({
        type: 'draft.cancelled',
        requestId,
        stage: 'cancelled',
        detail,
        error: detail,
        occurredAt: now()
    });
}

export function getDraftStage(requestId: string): DraftStageState | null {
    cleanupExpired();

    return statusMap.get(requestId) || null;
}
