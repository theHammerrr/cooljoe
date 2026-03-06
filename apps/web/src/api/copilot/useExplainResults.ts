import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface ExplainParams {
    question: string;
    query: string;
    results: unknown[];
}

export const useExplainResults = () => {
    return useMutation({
        mutationFn: async (params: ExplainParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/explain-results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to explain results");
            }

            return response.json();
        }
    });
};
