import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface DraftQueryParams {
    question: string;
    preferred?: string;
    constraints?: string;
}

export class DraftQueryApiError extends Error {
    issues?: string[];
    draft?: unknown;
}

export const useDraftQuery = () => {
    return useMutation({
        mutationFn: async (params: DraftQueryParams) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/draft-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const error = new DraftQueryApiError(payload.error || "Failed to draft query");
                const issues = Reflect.get(payload, 'issues');
                if (Array.isArray(issues)) {
                    error.issues = issues.filter((item): item is string => typeof item === 'string');
                }
                error.draft = Reflect.get(payload, 'draft');
                throw error;
            }
            return payload;
        }
    });
};
