import { AIProvider } from './AIProvider';
import OpenAI from 'openai';
import { buildDraftSystemPrompt, buildExplanationPrompt } from './promptBuilders';
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
        this.openai = new OpenAI({ apiKey: key });
        this.model = model;
        this.embeddingModel = embeddingModel;
    }

    async generateChatResponse(prompt: string, context?: unknown): Promise<string> {
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
        if (context) {
            messages.push({ role: 'system', content: `Context:\n${JSON.stringify(context)}` });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages
        });

        return response.choices[0].message.content || "";
    }

    async generateDraftQuery(question: string, context: Record<string, unknown>) {
        const systemPrompt = buildDraftSystemPrompt(context);

        console.time('generateDraftQuery-OpenAI'); // Added console.time
        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ],
            temperature: 0.1
        });
        console.timeEnd('generateDraftQuery-OpenAI'); // Added console.timeEnd

        return parseDraftResponse(response.choices[0].message.content);
    }

    async generateExplanation(question: string, sql: string, dataSample: unknown[], _schema: unknown) {
        void _schema;
        const systemPrompt = buildExplanationPrompt(question, sql, dataSample);
        console.time(`chat-OpenAI-${question.substring(0, 10)}`); // Added console.time, using question for unique ID
        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: "json_object" },
            messages: [
                { role: 'user', content: systemPrompt } // Changed to systemPrompt
            ],
            temperature: 0.3
        });
        console.timeEnd(`chat-OpenAI-${question.substring(0, 10)}`); // Added console.timeEnd

        return parseExplanationResponse(response.choices[0].message.content);
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const response = await this.openai.embeddings.create({
            model: this.embeddingModel,
            input: texts
        });
        return response.data.map(d => d.embedding);
    }
}
