import { Request, Response } from 'express';
import { getDraftStage } from './draftQuery/stageTracker';
import { createDraftJobId, DraftQueryCommandSchema } from '../domain/draftQuery';
import { issueDraftStatusToken, verifyDraftStatusToken } from '../domain/draftQueryToken';
import { draftJobStore } from '../application/DraftJobStore';
import { draftQueryApplicationService } from '../application/draftQueryApplicationService';

draftJobStore.ensureEventSubscription();

export const issueDraftQueryToken = async (_req: Request, res: Response) => {
    const requestId = createDraftJobId();
    const issued = issueDraftStatusToken(requestId);

    return res.json({
        requestId,
        statusToken: issued.token,
        expiresAt: issued.expiresAt
    });
};

export const draftQuery = async (req: Request, res: Response) => {
    const traceId = `draft-${Date.now().toString(36)}`;
    console.time(`[${traceId}] draftQuery-total`);
    const parsed = DraftQueryCommandSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid draft query payload.',
            issues: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        });
    }

    const command = parsed.data;
    const requestId = command.requestId;
    const statusToken = command.statusToken;

    if (!requestId || !statusToken || !verifyDraftStatusToken(statusToken, requestId)) {
        return res.status(401).json({ error: 'Invalid or expired draft status token.' });
    }

    try {
        const result = await draftQueryApplicationService.runDraftJob(command, requestId, traceId);

        return res.status(result.status).json(result.payload);
    } finally {
        console.timeEnd(`[${traceId}] draftQuery-total`);
    }
};

export const draftQueryStatus = async (req: Request, res: Response) => {
    const requestId = req.params.requestId;
    const token = typeof req.query?.token === 'string' ? req.query.token : '';

    if (!requestId) return res.status(400).json({ error: 'requestId is required.' });

    if (!token || !verifyDraftStatusToken(token, requestId)) {
        return res.status(401).json({ error: 'Invalid or expired draft status token.' });
    }
    const status = getDraftStage(requestId);

    if (status) return res.json(status);
    const persistedStatus = await draftJobStore.getStatus(requestId);

    if (!persistedStatus) return res.status(404).json({ error: 'request status not found.' });

    return res.json(persistedStatus);
};
