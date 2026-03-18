import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getErrorMessage } from '../utils/errorUtils';
import { extractReferencedTablesFromQuery } from '../safety/queryValidator';

export const acceptQuery = async (req: Request, res: Response) => {
    try {
        const { question, query, prismaQuery, mode } = req.body;
        const usedTables = typeof query === 'string' ? extractReferencedTablesFromQuery(query) : [];

        await retrievalService.saveAcceptedRecipe(question, query, prismaQuery, [mode], {
            source: 'accepted_query',
            mode,
            question,
            usedTables,
            schemas: Array.from(new Set(usedTables.map((table) => table.split('.').slice(0, -1).join('.')).filter(Boolean)))
        });
        res.json({ success: true, message: 'Query recipe accepted and embedding queued.' });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
