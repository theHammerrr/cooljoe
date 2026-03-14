import OpenAI from 'openai';
import { buildQueryAnalysisSummaryPrompt } from './promptBuilders';
import { parseQueryAnalysisSummaryResponse } from './responseParsers';

export async function buildOpenAiQueryAnalysisSummary(
    openai: OpenAI,
    model: string,
    input: { sql: string; findings: unknown[]; rawPlan: unknown; schema: unknown }
) {
    const prompt = buildQueryAnalysisSummaryPrompt(input);
    const response = await openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
    });

    return parseQueryAnalysisSummaryResponse(response.choices[0].message.content);
}
