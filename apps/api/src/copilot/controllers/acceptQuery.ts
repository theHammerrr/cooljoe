import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getErrorMessage } from '../utils/errorUtils';

export const acceptQuery = async (req: Request, res: Response) => {
    try {
        const { question, query, prismaQuery, mode } = req.body;
        await retrievalService.saveAcceptedRecipe(question, query, prismaQuery, [mode]);
        res.json({ success: true, message: "Query recipe accepted and embedding queued." });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
