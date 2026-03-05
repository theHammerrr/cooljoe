import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface ChatParams {
    prompt: string;
    context?: unknown;
}

export const useChat = () => {
    return useMutation({
        mutationFn: async (params: ChatParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to chat with AI");
            }
            return response.json();
        }
    });
};
