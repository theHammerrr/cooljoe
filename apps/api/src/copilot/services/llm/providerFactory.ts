import { AIProvider } from './AIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { OllamaProvider } from './OllamaProvider';

export function getProvider(): AIProvider {
    const providerType = process.env.AI_PROVIDER?.toLowerCase();

    if (providerType === 'openai') {
        return new OpenAIProvider();
    }

    // Default to Ollama for local execution
    return new OllamaProvider();
}
