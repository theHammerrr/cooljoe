import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';
import { SCHEMA_TOPOLOGY_QUERY_KEY } from './useGetSchemaTopology';

export const useRefreshSchema = () => {
    const queryClient = useQueryClient();

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
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SCHEMA_TOPOLOGY_QUERY_KEY });
        }
    });
};
