import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from './apiClient';

export const useAllowlist = () => {
    const queryClient = useQueryClient();

    const { data: allowedTables = [], isLoading: isFetching } = useQuery({
        queryKey: ['allowlist'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/copilot/allow-tables`);
            const allowedTables = res.data?.allowedTables;

            if (!Array.isArray(allowedTables)) {
                return [];
            }

            return allowedTables.filter((table): table is string => typeof table === 'string');
        }
    });

    const { mutate: removeTable, isPending: isRemoving } = useMutation({
        mutationFn: async (table: string) => {
            const res = await axios.delete(`${API_BASE_URL}/api/copilot/allow-tables`, {
                data: { table }
            });

            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allowlist'] });
        }
    });

    return {
        allowedTables,
        isFetching,
        removeTable,
        isRemoving
    };
};
