import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

export interface AnalyticsResponse {
    success: boolean;
    totalQueries: number;
    avgRuntimeMs: number;
    maxRuntimeMs: number;
    avgRowCount: number;
    recentQueries: {
        createdAt: string;
        runtimeMs: number;
        sqlQuery: string;
    }[];
}

export const useGetAnalytics = () => {
    return useQuery<AnalyticsResponse>({
        queryKey: ['analytics'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/analytics`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to load analytics");
            }
            return response.json();
        }
    });
};
