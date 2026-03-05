import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface AllowTableParams {
    table: string;
}

export const useAllowTable = () => {
    return useMutation({
        mutationFn: async (params: AllowTableParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/allow-tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to allow table");
            }
            return response.json();
        }
    });
};
