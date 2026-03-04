import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface RunQueryParams {
    query: string;
    mode?: string;
}

export const useRunQuery = () => {
    return useMutation({
        mutationFn: async (params: RunQueryParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/run-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to run query");
            }
            return response.json();
        }
    });
};
