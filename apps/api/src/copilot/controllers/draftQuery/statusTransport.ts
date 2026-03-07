import { Request, Response } from 'express';
import { draftJobStore } from '../../application/DraftJobStore';
import { verifyDraftStatusToken } from '../../domain/draftQueryToken';
import { getDraftStage } from './stageTracker';
import { DraftJobEvent } from '../../domain/draftQuery';

export function getStatusToken(req: Request): string {
    return typeof req.query?.token === 'string' ? req.query.token : '';
}

export function isAuthorizedDraftStatusRequest(requestId: string | undefined, token: string, res: Response): requestId is string {
    if (!requestId) {
        res.status(400).json({ error: 'requestId is required.' });

        return false;
    }

    if (!token || !verifyDraftStatusToken(token, requestId)) {
        res.status(401).json({ error: 'Invalid or expired draft status token.' });

        return false;
    }

    return true;
}

export async function resolveDraftStatus(requestId: string) {
    const inMemoryStatus = getDraftStage(requestId);

    if (inMemoryStatus) return inMemoryStatus;

    return draftJobStore.getStatus(requestId);
}

export function writeSse(res: Response, payload: unknown): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function buildDraftStatusEventPayload(event: DraftJobEvent) {
    const stage = event.type === 'draft.failed'
        ? 'failed'
        : event.type === 'draft.cancelled'
            ? 'cancelled'
        : event.type === 'draft.completed'
            ? 'completed'
            : event.stage;

    return {
        requestId: event.requestId,
        stage,
        attempt: event.attempt,
        detail: event.detail,
        done: event.type === 'draft.failed' || event.type === 'draft.completed' || event.type === 'draft.cancelled',
        error: event.error,
        updatedAt: event.occurredAt
    };
}
