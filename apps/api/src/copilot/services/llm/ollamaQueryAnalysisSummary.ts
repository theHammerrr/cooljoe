import type { Ollama } from 'ollama';
import { buildQueryAnalysisSummaryPrompt } from './promptBuilders';
import { parseQueryAnalysisSummaryResponse } from './responseParsers';

export async function buildOllamaQueryAnalysisSummary(
    ollama: Ollama,
    model: string,
    input: { sql: string; findings: unknown[]; rawPlan: unknown; schema: unknown }
) {
    const prompt = buildQueryAnalysisSummaryPrompt(input);
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
