import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

interface DraftQueryParams {
    question: string;
    preferred?: 'sql' | 'prisma';
    constraints?: string;
    requestId: string;
    statusToken: string;
}

export interface DraftQueryToken {
    requestId: string;
    statusToken: string;
    expiresAt: number;
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

export async function issueDraftQueryToken(): Promise<DraftQueryToken> {
    const response = await fetch(`${API_BASE_URL}/api/copilot/draft-query-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : 'Failed to issue draft token');
    }

    if (
        typeof Reflect.get(payload, 'requestId') !== 'string' ||
        typeof Reflect.get(payload, 'statusToken') !== 'string' ||
        typeof Reflect.get(payload, 'expiresAt') !== 'number'
    ) {
        throw new Error('Invalid draft token payload');
    }

    return {
        requestId: String(Reflect.get(payload, 'requestId')),
        statusToken: String(Reflect.get(payload, 'statusToken')),
        expiresAt: Number(Reflect.get(payload, 'expiresAt'))
    };
}
