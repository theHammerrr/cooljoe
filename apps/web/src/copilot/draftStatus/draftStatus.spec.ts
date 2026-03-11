/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToDraftStatus } from './draftStatus';

class FakeEventSource {
    static instances: FakeEventSource[] = [];

    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    onerror: (() => void) | null = null;
    readonly url: string;
    closed = false;

    constructor(url: string) {
        this.url = url;
        FakeEventSource.instances.push(this);
    }

    close(): void {
        this.closed = true;
    }

    emit(data: unknown): void {
        if (!this.onmessage) return;

        this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }

    fail(): void {
        if (this.onerror) this.onerror();
    }
}

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('draft status transport', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeEventSource.instances = [];
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('falls back to polling when EventSource is unavailable', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                requestId: 'draft_1',
                stage: 'completed',
                done: true,
                updatedAt: Date.now()
            })
        });
        const onStatusText = vi.fn();
        Object.defineProperty(window, 'EventSource', { value: undefined, configurable: true });
        vi.stubGlobal('fetch', fetchMock);

        const stop = subscribeToDraftStatus('draft_1', 'token_1', onStatusText);

        await vi.runAllTimersAsync();
        await flushMicrotasks();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(String(fetchMock.mock.calls[0][0])).toContain('/draft-query-status/draft_1?token=token_1');
        expect(onStatusText).toHaveBeenCalledWith('Queueing draft job...');
        expect(onStatusText).toHaveBeenCalledWith('Draft ready.');

        stop();
    });

    it('uses SSE updates when EventSource is available', () => {
        const fetchMock = vi.fn();
        const onStatusText = vi.fn();
        Object.defineProperty(window, 'EventSource', { value: FakeEventSource, configurable: true });
        vi.stubGlobal('fetch', fetchMock);

        const stop = subscribeToDraftStatus('draft_2', 'token_2', onStatusText);
        const stream = FakeEventSource.instances[0];

        stream.emit({
            requestId: 'draft_2',
            stage: 'planning_with_llm',
            attempt: 2,
            done: false,
            updatedAt: Date.now()
        });
        stream.emit({
            requestId: 'draft_2',
            stage: 'completed',
            done: true,
            updatedAt: Date.now()
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(onStatusText).toHaveBeenCalledWith('Planning with LLM (attempt 2)...');
        expect(onStatusText).toHaveBeenCalledWith('Draft ready.');
        expect(stream.closed).toBe(true);

        stop();
    });

    it('falls back to polling when the SSE stream errors', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                requestId: 'draft_3',
                stage: 'retrying_with_stricter_context',
                attempt: 2,
                done: true,
                updatedAt: Date.now()
            })
        });
        const onStatusText = vi.fn();
        Object.defineProperty(window, 'EventSource', { value: FakeEventSource, configurable: true });
        vi.stubGlobal('fetch', fetchMock);

        const stop = subscribeToDraftStatus('draft_3', 'token_3', onStatusText);
        const stream = FakeEventSource.instances[0];

        stream.fail();
        await vi.runAllTimersAsync();
        await flushMicrotasks();

        expect(stream.closed).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(onStatusText).toHaveBeenCalledWith('Retrying with stricter context (attempt 2)...');

        stop();
    });

    it('renders a cancelled terminal state', () => {
        const fetchMock = vi.fn();
        const onStatusText = vi.fn();
        Object.defineProperty(window, 'EventSource', { value: FakeEventSource, configurable: true });
        vi.stubGlobal('fetch', fetchMock);

        const stop = subscribeToDraftStatus('draft_4', 'token_4', onStatusText);
        const stream = FakeEventSource.instances[0];

        stream.emit({
            requestId: 'draft_4',
            stage: 'cancelled',
            done: true,
            updatedAt: Date.now()
        });

        expect(onStatusText).toHaveBeenCalledWith('Draft cancelled.');
        expect(stream.closed).toBe(true);

        stop();
    });
});
