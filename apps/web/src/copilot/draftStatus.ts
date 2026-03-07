import type { DraftStatusPayload } from './draftStatus.shared';
import { getDraftStatusStreamUrl, isDraftStatusPayload, toStatusText } from './draftStatus.shared';
import { startDraftStatusPolling } from './draftStatusPolling';

export function subscribeToDraftStatus(
    requestId: string,
    statusToken: string,
    onStatusText: (text: string) => void,
    onDone?: (payload: DraftStatusPayload) => void
): () => void {
    onStatusText('Queueing draft job...');

    if (typeof window === 'undefined' || typeof window.EventSource !== 'function') {
        return startDraftStatusPolling(requestId, statusToken, onStatusText, onDone);
    }

    let stopped = false;
    let stopPolling: (() => void) | null = null;
    const eventSource = new window.EventSource(getDraftStatusStreamUrl(requestId, statusToken));

    const startPollingFallback = () => {
        if (stopped || stopPolling) return;
        eventSource.close();
        stopPolling = startDraftStatusPolling(requestId, statusToken, onStatusText, onDone);
    };

    eventSource.onmessage = (event) => {
        let payload: unknown;

        try {
            payload = JSON.parse(event.data);
        } catch {
            return;
        }

        if (!isDraftStatusPayload(payload)) return;

        onStatusText(toStatusText(payload.stage, payload.attempt));

        if (payload.done) {
            stopped = true;
            onDone?.(payload);
            eventSource.close();
        }
    };

    eventSource.onerror = () => {
        startPollingFallback();
    };

    return () => {
        stopped = true;
        eventSource.close();

        if (stopPolling) stopPolling();
    };
}
