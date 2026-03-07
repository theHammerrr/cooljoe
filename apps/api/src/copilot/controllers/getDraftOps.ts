import { Request, Response } from 'express';
import { draftJobStore } from '../application/DraftJobStore';
import { draftJobQueue } from '../application/draftJobQueue';
import { isAuthorizedOpsRequest } from './opsAuth';

export const getDraftOps = async (req: Request, res: Response) => {
    if (!isAuthorizedOpsRequest(req)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const [queue, jobs] = await Promise.all([
        Promise.resolve(draftJobQueue.getSnapshot()),
        draftJobStore.getOperationalSnapshot()
    ]);

    return res.json({
        queue,
        jobs,
        generatedAt: Date.now()
    });
};
