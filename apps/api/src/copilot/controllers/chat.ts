import { Request, Response } from 'express';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';

const aiProvider = getProvider();

export const chat = async (req: Request, res: Response) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        if (!aiProvider.generateChatResponse) {
            return res.status(501).json({ error: "Current AI Provider does not support conversational chat." });
        }

        const responseText = await aiProvider.generateChatResponse(prompt, context);
        res.json({ success: true, message: responseText });
    } catch (error: unknown) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
