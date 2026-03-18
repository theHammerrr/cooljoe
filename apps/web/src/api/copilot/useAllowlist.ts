import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from './apiClient';

interface AllowlistResponse {
    allowlistEnabled?: boolean;
    allowedTables?: unknown;
}

interface AllowlistState {
    allowlistEnabled: boolean;
    allowedTables: string[];
}

const defaultAllowlistState: AllowlistState = {
    allowlistEnabled: true,
    allowedTables: []
};

export const useAllowlist = () => {
    const queryClient = useQueryClient();
    const { data = defaultAllowlistState, isLoading: isFetching } = useQuery({
        queryKey: ['allowlist'],
        queryFn: async (): Promise<AllowlistState> => {
            const res = await axios.get<AllowlistResponse>(`${API_BASE_URL}/api/copilot/allow-tables`);
            const allowedTables = Array.isArray(res.data?.allowedTables)
                ? res.data.allowedTables.filter((table): table is string => typeof table === 'string')
                : [];

            return {
                allowlistEnabled: res.data?.allowlistEnabled !== false,
                allowedTables
            };
        }
    });

    const { mutate: removeTable, isPending: isRemoving } = useMutation({
        mutationFn: async (table: string) => {
            const res = await axios.delete(`${API_BASE_URL}/api/copilot/allow-tables`, { data: { table } });

            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allowlist'] });
        }
    });

    return {
        allowlistEnabled: data.allowlistEnabled,
        allowedTables: data.allowedTables,
        isFetching,
        removeTable,
        isRemoving
    };
};
