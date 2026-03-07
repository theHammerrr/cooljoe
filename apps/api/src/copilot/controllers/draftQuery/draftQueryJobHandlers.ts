import { Request, Response } from 'express';
import { draftJobStore } from '../../application/DraftJobStore';
import { DraftJobQueueFullError, draftJobQueue } from '../../application/draftJobQueue';
import { draftQueryApplicationService } from '../../application/draftQueryApplicationService';
import { createDraftJobId, CreateDraftJobCommandSchema, DraftQueryCommandSchema } from '../../domain/draftQuery';
import { issueDraftStatusToken, verifyDraftStatusToken } from '../../domain/draftQueryToken';
import { finishDraftStage } from './stageTracker';
import { toValidationIssues } from './draftQueryParsing';

export const issueDraftQueryToken = async (_req: Request, res: Response) => {
    const requestId = createDraftJobId();
    const issued = issueDraftStatusToken(requestId);

    return res.json({
        requestId,
        statusToken: issued.token,
        expiresAt: issued.expiresAt
    });
};

export const createDraftJob = async (req: Request, res: Response) => {
    const parsed = CreateDraftJobCommandSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid draft job payload.',
            issues: toValidationIssues(parsed.error.issues)
        });
    }

    const requestId = createDraftJobId();
    const traceId = `draft-${Date.now().toString(36)}`;
    const issued = issueDraftStatusToken(requestId);
    const preferredMode = parsed.data.preferred === 'prisma' ? 'prisma' : 'sql';
    await draftJobStore.createJob({
        requestId,
        question: parsed.data.question,
        preferredMode,
        constraints: parsed.data.constraints
    });

    try {
        draftJobQueue.enqueue({
            command: { ...parsed.data, requestId, statusToken: issued.token },
            requestId,
            traceId
        });
    } catch (error) {
        if (error instanceof DraftJobQueueFullError) {
            await draftJobStore.recordResult(requestId, 503, { error: error.message });
            finishDraftStage(requestId, error.message);

            return res.status(503).json({ error: error.message });
        }

        throw error;
    }

    return res.status(202).json({
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
            issues: toValidationIssues(parsed.error.issues)
        });
    }

    const command = parsed.data;

    if (!command.requestId || !command.statusToken || !verifyDraftStatusToken(command.statusToken, command.requestId)) {
        return res.status(401).json({ error: 'Invalid or expired draft status token.' });
    }

    try {
        const result = await draftQueryApplicationService.runDraftJob(command, command.requestId, traceId);

        return res.status(result.status).json(result.payload);
    } finally {
        console.timeEnd(`[${traceId}] draftQuery-total`);
    }
};
