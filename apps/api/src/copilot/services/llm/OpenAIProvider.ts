import { AIProvider } from './AIProvider';
import OpenAI from 'openai';

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

Context Context Details:
${JSON.stringify(context, null, 2)}
`;

        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ],
            temperature: 0.1
        });

        const parsed = JSON.parse(response.choices[0].message.content || "{}");
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

Return a JSON object:
{ "explanation": "Human readable explanation", "followUps": ["Suggested follow up question 1"] }
`;
        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: "json_object" },
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.3
        });

        const parsed = JSON.parse(response.choices[0].message.content || "{}");
        return {
            explanation: parsed.explanation || "",
            followUps: parsed.followUps || []
        };
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const response = await this.openai.embeddings.create({
            model: this.embeddingModel,
            input: texts
        });
        return response.data.map(d => d.embedding);
    }
}
