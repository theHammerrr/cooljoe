import type { Ollama } from 'ollama';
import type { QueryAnalysisSummaryInput } from './AIProvider';
import { buildQueryAnalysisOptimizationPrompt } from './queryAnalysisOptimizationPrompt';
import { parseQueryAnalysisSummaryResponse } from './responseParsers';

export async function buildOllamaQueryAnalysisSummary(
    ollama: Ollama,
    model: string,
    input: QueryAnalysisSummaryInput
) {
    const prompt = buildQueryAnalysisOptimizationPrompt(input);
    const response = await ollama.chat({
        model,
        format: 'json',
        options: {
            temperature: 0.2
        },
        messages: [{ role: 'user', content: prompt }]
    });

    return parseQueryAnalysisSummaryResponse(response.message.content);
}
