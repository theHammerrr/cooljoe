import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';

const aiProvider = getProvider();

export const explainResults = async (req: Request, res: Response) => {
    try {
        const { question, query, results } = req.body;
        const schema = await retrievalService.getLatestSchema();
        const explanation = await aiProvider.generateExplanation(question, query, results, schema);
        res.json(explanation);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
