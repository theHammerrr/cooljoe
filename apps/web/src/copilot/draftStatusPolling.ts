import type { DraftStatusPayload } from './draftStatus.shared';
import { getDraftStatusPollingUrl, isDraftStatusPayload, toStatusText } from './draftStatus.shared';

function handleDraftStatusPayload(payload: DraftStatusPayload, onStatusText: (text: string) => void): boolean {
    onStatusText(toStatusText(payload.stage, payload.attempt));

    return payload.done;
}

export function startDraftStatusPolling(
    requestId: string,
    statusToken: string,
    onStatusText: (text: string) => void,
    onDone?: (payload: DraftStatusPayload) => void
): () => void {
    let stopped = false;
    let timeoutId: number | null = null;
    let inFlight = false;

    const poll = async () => {
        if (stopped || inFlight) return;
        inFlight = true;

        try {
            const response = await fetch(getDraftStatusPollingUrl(requestId, statusToken));

            if (!response.ok) return;

            const payload = await response.json().catch(() => null);

            if (!isDraftStatusPayload(payload)) return;

            if (handleDraftStatusPayload(payload, onStatusText)) {
                stopped = true;
                onDone?.(payload);

                if (timeoutId !== null) window.clearTimeout(timeoutId);

                return;
            }
        } catch (error: unknown) {
            console.error('Draft status polling failed.', { requestId, error });
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
