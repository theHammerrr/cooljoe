import OpenAI from 'openai';
import type { QueryAnalysisSummaryInput } from './AIProvider';
import { buildQueryAnalysisOptimizationPrompt } from './queryAnalysisOptimizationPrompt';
import { parseQueryAnalysisSummaryResponse } from './responseParsers';

export async function buildOpenAiQueryAnalysisSummary(
    openai: OpenAI,
    model: string,
    input: QueryAnalysisSummaryInput
) {
    const prompt = buildQueryAnalysisOptimizationPrompt(input);
    const response = await openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
    });

    return parseQueryAnalysisSummaryResponse(response.choices[0].message.content);
}
