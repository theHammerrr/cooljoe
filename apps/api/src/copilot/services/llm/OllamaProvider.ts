import { AIProvider } from './AIProvider';
import { Ollama } from 'ollama';
import { buildDraftSystemPrompt, buildExplanationPrompt } from './promptBuilders';
import { parseDraftResponse, parseExplanationResponse } from './responseParsers';

export class OllamaProvider implements AIProvider {
    private ollama: Ollama;
    private model: string;
    private embeddingModel: string;

    constructor(
        host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
        model = process.env.AI_MODEL || 'llama3',
        embeddingModel = process.env.AI_EMBEDDING_MODEL || 'nomic-embed-text'
    ) {
        this.ollama = new Ollama({ host });
        this.model = model;
        this.embeddingModel = embeddingModel;
    }

    async generateChatResponse(prompt: string, context?: unknown): Promise<string> {
        let systemPrompt = '';
        if (context) {
            systemPrompt = `Context:\n${JSON.stringify(context)}\n\n`;
        }

        console.time(`chat-${prompt.substring(0, 10)}`);
        const response = await this.ollama.chat({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        });
        console.timeEnd(`chat-${prompt.substring(0, 10)}`);

        return response.message.content;
    }

    async generateDraftQuery(question: string, context: Record<string, unknown>) {
        const systemPrompt = buildDraftSystemPrompt(context);

        console.time('generateDraftQuery');
        const response = await this.ollama.chat({
            model: this.model,
            format: 'json',
            options: {
                temperature: 0.1
            },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ],
        });
        console.timeEnd('generateDraftQuery');

        return parseDraftResponse(response.message.content);
    }

    async generateExplanation(question: string, sql: string, dataSample: unknown[], _schema: unknown) {
        void _schema;
        const prompt = buildExplanationPrompt(question, sql, dataSample);
        const response = await this.ollama.chat({
            model: this.model,
            format: 'json',
            options: {
                temperature: 0.3
            },
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        return parseExplanationResponse(response.message.content);
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        // Ollama embedding endpoint typically takes one text at a time via the JS SDK currently,
        // or we can map over them.
        const embeddings = [];
        for (const text of texts) {
            const response = await this.ollama.embeddings({
                model: this.embeddingModel,
                prompt: text
            });
            embeddings.push(response.embedding);
        }
        return embeddings;
    }
}
