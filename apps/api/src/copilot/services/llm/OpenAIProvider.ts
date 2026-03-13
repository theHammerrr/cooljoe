import { AIProvider } from './AIProvider';
import OpenAI, { ClientOptions } from 'openai';
import { buildChatSystemPrompt, buildDraftSystemPrompt, buildExplanationPrompt } from './promptBuilders';
import { parseDraftResponse, parseExplanationResponse } from './responseParsers';

export class OpenAIProvider implements AIProvider {
    private openai: OpenAI;
    private model: string;
    private embeddingModel: string;

    constructor(
        apiKey?: string,
        model = process.env.AI_MODEL || 'gpt-4o',
        embeddingModel = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small'
    ) {
        const key = apiKey || process.env.OPENAI_API_KEY;

        if (!key) throw new Error("OPENAI_API_KEY is missing");

        const openAiOptions: ClientOptions = {
            apiKey: key,
        }

        const baseURL = process.env.OPENAI_BASE_URL;

        if (baseURL) {
            openAiOptions.baseURL = baseURL;
        }


        this.openai = new OpenAI(openAiOptions);
        this.model = model;
        this.embeddingModel = embeddingModel;
    }

    async generateChatResponse(prompt: string, context?: unknown): Promise<string> {
        const systemPrompt = buildChatSystemPrompt(context);
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
        messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages
        });

        return response.choices[0].message.content || "";
    }

    async streamChatResponse(
        prompt: string,
        context: unknown,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const systemPrompt = buildChatSystemPrompt(context);
        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            stream: true
        });
        let fullResponse = '';

        for await (const part of stream) {
            const chunk = part.choices[0]?.delta?.content || '';

            if (!chunk) continue;
            fullResponse += chunk;
            onChunk(chunk);
        }

        return fullResponse;
    }

    async generateDraftQuery(question: string, context: Record<string, unknown>) {
        const systemPrompt = buildDraftSystemPrompt(context);

        console.time('generateDraftQuery-OpenAI');
        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ],
            temperature: 0.1
        });
        console.timeEnd('generateDraftQuery-OpenAI');

        return parseDraftResponse(response.choices[0].message.content);
    }

    async generateExplanation(question: string, sql: string, dataSample: unknown[], _schema: unknown) {
        void _schema;
        const systemPrompt = buildExplanationPrompt(question, sql, dataSample);
        console.time(`chat-OpenAI-${question.substring(0, 10)}`);
        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'user', content: systemPrompt }
            ],
            temperature: 0.3
        });
        console.timeEnd(`chat-OpenAI-${question.substring(0, 10)}`);

        return parseExplanationResponse(response.choices[0].message.content);
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const response = await this.openai.embeddings.create({
            model: this.embeddingModel,
            input: texts
        });

        return response.data.map((d) => d.embedding);
    }
}
