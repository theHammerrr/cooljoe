import { Request, Response } from 'express';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';
import { buildChatContext } from './chat/buildChatContext';
import { resolveSuggestedDraft } from './chat/intentRouter';

const aiProvider = getProvider();

export const chat = async (req: Request, res: Response) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

        if (!aiProvider.generateChatResponse) {
            return res.status(501).json({ error: 'Current AI Provider does not support conversational chat.' });
        }

        const dbAwareContext = await buildChatContext({ prompt, context });
        const responseText = await aiProvider.generateChatResponse(prompt, dbAwareContext);
        const suggestedDraft = resolveSuggestedDraft(prompt);

        return res.json({ success: true, message: responseText, suggestedDraft });
    } catch (error: unknown) {
        console.error('Chat Error:', error);

        return res.status(500).json({ error: getErrorMessage(error) });
    }
};
