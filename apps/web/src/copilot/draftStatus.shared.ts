import { API_BASE_URL } from '../api/copilot/apiClient';

export interface DraftStatusPayload {
    requestId: string;
    stage: string;
    attempt?: number;
    detail?: string;
    done: boolean;
    error?: string;
    updatedAt: number;
}

export function toStatusText(stage: string, attempt?: number): string {
    switch (stage) {
        case 'pending': return 'Queueing draft job...';
        case 'fetching_context': return 'Fetching schema + context...';
        case 'building_context': return 'Preparing draft context...';
        case 'planning_with_llm': return `Planning with LLM (attempt ${attempt || 1})...`;
        case 'compiling_and_validating': return 'Compiling + validating plan...';
        case 'retrying_with_stricter_context': return `Retrying with stricter context (attempt ${attempt || 2})...`;
        case 'finalizing_draft': return 'Finalizing draft...';
        case 'completed': return 'Draft ready.';
        case 'failed': return 'Draft failed.';
        case 'cancelled': return 'Draft cancelled.';
        default: return 'Thinking...';
    }
}

export function isDraftStatusPayload(value: unknown): value is DraftStatusPayload {
    if (!value || typeof value !== 'object') return false;

    if (!('requestId' in value) || !('stage' in value) || !('done' in value) || !('updatedAt' in value)) return false;

    return (
        typeof value.requestId === 'string' &&
        typeof value.stage === 'string' &&
        typeof value.done === 'boolean' &&
        typeof value.updatedAt === 'number'
    );
}

export function getDraftStatusPollingUrl(requestId: string, statusToken: string): string {
    return `${API_BASE_URL}/api/copilot/draft-query-status/${encodeURIComponent(requestId)}?token=${encodeURIComponent(statusToken)}`;
}

export function getDraftStatusStreamUrl(requestId: string, statusToken: string): string {
    return `${API_BASE_URL}/api/copilot/draft-query-status/${encodeURIComponent(requestId)}/stream?token=${encodeURIComponent(statusToken)}`;
}
