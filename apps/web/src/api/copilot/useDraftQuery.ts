import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface DraftQueryParams {
    question: string;
    preferred?: string;
    constraints?: string;
}

export const useDraftQuery = () => {
    return useMutation({
        mutationFn: async (params: DraftQueryParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/draft-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to draft query");
            }
            return response.json();
        }
    });
};
