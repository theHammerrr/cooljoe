/* eslint-disable max-lines */
import { AIProvider } from './AIProvider';
import { Ollama } from 'ollama';

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

        const response = await this.ollama.chat({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        });

        return response.message.content;
    }

    async generateDraftQuery(question: string, context: Record<string, unknown>) {
        const systemPrompt = `You are a DB Copilot. Given the user's question, table schema, and relevant business glossary, generate a draft SQL query and its intent.
Rules:
- Generate ONLY a READ-ONLY SELECT query.
- Make reasonable assumptions if ambiguous.
- Return the output strictly as a JSON object matching this schema:
{
  "intent": "Short summary of what the query does",
  "assumptions": ["List of assumptions"],
  "sql": "SELECT ...",
  "prisma": "prisma.model.findMany(...)",
  "expectedColumns": ["col1", "col2"],
  "riskFlags": ["List any performance/accuracy risks"]
}

Context Details:
${JSON.stringify(context, null, 2)}
`;

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

        const parsed = JSON.parse(response.message.content || "{}");
        return {
            intent: parsed.intent || "",
            assumptions: parsed.assumptions || [],
            sql: parsed.sql || "",
            prisma: parsed.prisma || "",
            expectedColumns: parsed.expectedColumns || [],
            riskFlags: parsed.riskFlags || []
        };
    }

    async generateExplanation(question: string, sql: string, dataSample: unknown[], _schema: unknown) {
        void _schema;
        const prompt = `Explain the results of the following executed SQL query to the user based on their question.
Question: ${question}
SQL: ${sql}
Results Sample (up to 5 rows):
${JSON.stringify(dataSample.slice(0, 5))}

Return ONLY a JSON object:
{ "explanation": "Human readable explanation", "followUps": ["Suggested follow up question 1"] }
`;
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

        const parsed = JSON.parse(response.message.content || "{}");
        return {
            explanation: parsed.explanation || "",
            followUps: parsed.followUps || []
        };
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
