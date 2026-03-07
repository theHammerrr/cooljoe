import { Request, Response } from 'express';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';
import { resolveSuggestedDraftFromAnswer } from './chat/answerDraftSuggestion';
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
        const suggestedDraft = resolveSuggestedDraftFromAnswer(prompt, responseText) || resolveSuggestedDraft(prompt);

        return res.json({ success: true, message: responseText, suggestedDraft });
    } catch (error: unknown) {
        console.error('Chat Error:', error);

        return res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const chatStream = async (req: Request, res: Response) => {
    const { prompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (!aiProvider.generateChatResponse && !aiProvider.streamChatResponse) {
        return res.status(501).json({ error: 'Current AI Provider does not support conversational chat.' });
    }

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    writeChatStreamEvent(res, { type: 'start' });

    try {
        const dbAwareContext = await buildChatContext({ prompt, context });
        const responseText = aiProvider.streamChatResponse
            ? await aiProvider.streamChatResponse(prompt, dbAwareContext, (chunk) => writeChatStreamEvent(res, { type: 'delta', text: chunk }))
            : await streamFromNonStreamingProvider(prompt, dbAwareContext, res);
        const suggestedDraft = resolveSuggestedDraftFromAnswer(prompt, responseText) || resolveSuggestedDraft(prompt);

        writeChatStreamEvent(res, { type: 'done', message: responseText, suggestedDraft });
        res.end();
    } catch (error: unknown) {
        console.error('Chat Stream Error:', error);
        writeChatStreamEvent(res, { type: 'error', error: getErrorMessage(error) });
        res.end();
    }
};

async function streamFromNonStreamingProvider(prompt: string, context: unknown, res: Response) {
    if (!aiProvider.generateChatResponse) {
        throw new Error('Current AI Provider does not support conversational chat.');
    }

    const responseText = await aiProvider.generateChatResponse(prompt, context);

    if (responseText) {
        writeChatStreamEvent(res, { type: 'delta', text: responseText });
    }

    return responseText;
}

function writeChatStreamEvent(res: Response, event: Record<string, unknown>) {
    res.write(`${JSON.stringify(event)}\n`);
}
