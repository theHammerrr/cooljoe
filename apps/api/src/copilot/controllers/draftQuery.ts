import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';

const aiProvider = getProvider();

export const draftQuery = async (req: Request, res: Response) => {
    try {
        const { question, preferred = 'sql', constraints } = req.body;

        const relatedDocs = await retrievalService.findRelevantDocs(question, 2);
        const relatedRecipes = await retrievalService.findRelevantRecipes(question, 2);
        const schema = await retrievalService.getLatestSchema();

        const context = { schema, glossary: relatedDocs, similarExamples: relatedRecipes, preferredMode: preferred, constraints };
        const draft = await aiProvider.generateDraftQuery(question, context);

        res.json(draft);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
