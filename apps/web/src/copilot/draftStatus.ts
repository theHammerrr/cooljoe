import { API_BASE_URL } from '../api/copilot/apiClient';

function toStatusText(stage: string, attempt?: number): string {
    switch (stage) {
        case 'fetching_context': return 'Fetching schema + context...';
        case 'building_context': return 'Preparing draft context...';
        case 'planning_with_llm': return `Planning with LLM (attempt ${attempt || 1})...`;
        case 'compiling_and_validating': return 'Compiling + validating plan...';
        case 'retrying_with_stricter_context': return `Retrying with stricter context (attempt ${attempt || 2})...`;
        case 'finalizing_draft': return 'Finalizing draft...';
        case 'completed': return 'Draft ready.';
        case 'failed': return 'Draft failed.';
        default: return 'Thinking...';
    }
}

export function startDraftStatusPolling(
    requestId: string,
    statusToken: string,
    onStatusText: (text: string) => void
): () => void {
    onStatusText('Fetching schema + context...');
    let stopped = false;
    let timeoutId: number | null = null;
    let inFlight = false;

    const poll = async () => {
        if (stopped || inFlight) return;
        inFlight = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/copilot/draft-query-status/${encodeURIComponent(requestId)}?token=${encodeURIComponent(statusToken)}`);

            if (!response.ok) return;
            const payload = await response.json().catch(() => null);

            if (!payload || typeof payload !== 'object') return;
            const stage = typeof Reflect.get(payload, 'stage') === 'string' ? String(Reflect.get(payload, 'stage')) : '';
            const attemptValue = Reflect.get(payload, 'attempt');
            const attempt = typeof attemptValue === 'number' ? attemptValue : undefined;

            if (stage) onStatusText(toStatusText(stage, attempt));

            if (Reflect.get(payload, 'done') === true) {
                stopped = true;

                if (timeoutId !== null) window.clearTimeout(timeoutId);

                return;
            }
        } catch {
            // no-op
        } finally {
            inFlight = false;

            if (!stopped) timeoutId = window.setTimeout(poll, 300);
        }
    };

    timeoutId = window.setTimeout(poll, 0);

    return () => {
        stopped = true;

        if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
}
