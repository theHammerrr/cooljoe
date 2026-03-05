import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

export const useRefreshSchema = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/refresh-schema`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to refresh schema");
            }
            return response.json();
        }
    });
};
