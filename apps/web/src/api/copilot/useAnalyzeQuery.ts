import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';
import { isQueryAnalysisResult } from './isQueryAnalysisResult';
import type { AnalyzeQueryParams, QueryAnalysisResult } from './queryAnalysisTypes';

export type { QueryAnalysisFinding, QueryAnalysisMode, QueryAnalysisResult } from './queryAnalysisTypes';

export const useAnalyzeQuery = () => {
    return useMutation({
        mutationFn: async ({ query, mode = 'explain' }: AnalyzeQueryParams): Promise<QueryAnalysisResult> => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/analyze-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, mode })
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok || !Reflect.get(payload, 'success')) {
                throw new Error(typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : 'Failed to analyze query');
            }

            if (!isQueryAnalysisResult(payload)) {
                throw new Error('Invalid query analysis payload');
            }

            return payload;
        }
    });
};
