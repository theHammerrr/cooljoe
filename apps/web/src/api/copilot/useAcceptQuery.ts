import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface AcceptParams {
    question: string;
    query: string;
    prismaQuery?: string;
    mode: string;
    notes?: string;
}

export const useAcceptQuery = () => {
    return useMutation({
        mutationFn: async (params: AcceptParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/accept-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to accept query");
            }

            return response.json();
        }
    });
};
