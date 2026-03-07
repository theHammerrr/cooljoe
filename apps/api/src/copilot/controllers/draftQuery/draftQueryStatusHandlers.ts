import { Request, Response } from 'express';
import { draftJobStore } from '../../application/DraftJobStore';
import { draftJobEventBus } from '../../application/draftJobEventBus';
import { cancelDraftStage } from './stageTracker';
import {
    buildDraftStatusEventPayload,
    getStatusToken,
    isAuthorizedDraftStatusRequest,
    resolveDraftStatus,
    writeSse
} from './statusTransport';

export const getDraftJob = async (req: Request, res: Response) => {
    const requestId = req.params.requestId;
    const token = getStatusToken(req);

    if (!isAuthorizedDraftStatusRequest(requestId, token, res)) return;

    const job = await draftJobStore.getJob(requestId);

    if (!job) return res.status(404).json({ error: 'request status not found.' });

    return res.json(job);
};

export const cancelDraftJob = async (req: Request, res: Response) => {
    const requestId = req.params.requestId;
    const token = getStatusToken(req);

    if (!isAuthorizedDraftStatusRequest(requestId, token, res)) return;

    const existingJob = await draftJobStore.getJob(requestId);

    if (!existingJob) return res.status(404).json({ error: 'request status not found.' });

    if (existingJob.status === 'cancelled' || existingJob.stage === 'cancelled') return res.status(200).json(existingJob);

    if (existingJob.done) return res.status(409).json({ error: 'Draft job is already finished and cannot be cancelled.' });

    const reason = 'Draft job cancelled by client.';
    const cancelled = await draftJobStore.cancelJob(requestId, reason);

    if (!cancelled) {
        const latestJob = await draftJobStore.getJob(requestId);

        if (latestJob) return res.status(latestJob.done ? 409 : 200).json(latestJob);

        return res.status(409).json({ error: 'Draft job could not be cancelled.' });
    }

    cancelDraftStage(requestId, reason);

    const cancelledJob = await draftJobStore.getJob(requestId);

    return res.status(202).json(cancelledJob ?? { requestId, status: 'cancelled', stage: 'cancelled', done: true, error: reason });
};

export const draftQueryStatus = async (req: Request, res: Response) => {
    const requestId = req.params.requestId;
    const token = getStatusToken(req);

    if (!isAuthorizedDraftStatusRequest(requestId, token, res)) return;

    const status = await resolveDraftStatus(requestId);

    if (status) return res.json(status);

    return res.status(404).json({ error: 'request status not found.' });
};

export const draftQueryStatusStream = async (req: Request, res: Response) => {
    const requestId = req.params.requestId;
    const token = getStatusToken(req);

    if (!isAuthorizedDraftStatusRequest(requestId, token, res)) return;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const status = await resolveDraftStatus(requestId);

    if (status) writeSse(res, status);

    const unsubscribe = draftJobEventBus.subscribe((event) => {
        if (event.requestId !== requestId) return;

        writeSse(res, buildDraftStatusEventPayload(event));
    });
    const heartbeatId = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 15000);

    req.on('close', () => {
        clearInterval(heartbeatId);
        unsubscribe();
        res.end();
    });
};
