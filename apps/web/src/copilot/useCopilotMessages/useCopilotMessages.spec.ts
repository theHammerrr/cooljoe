/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopilotMessages } from './useCopilotMessages';

const mocks = vi.hoisted(() => ({
    createDraftJob: vi.fn(),
    cancelDraftJob: vi.fn(),
    getDraftJob: vi.fn(),
    subscribeToDraftStatus: vi.fn(),
    mutate: vi.fn()
}));

vi.mock('../../api/copilot/useDraftQuery', () => ({
    createDraftJob: mocks.createDraftJob,
    cancelDraftJob: mocks.cancelDraftJob,
    getDraftJob: mocks.getDraftJob,
    DraftQueryApiError: class DraftQueryApiError extends Error {
        issues?: string[];
        draft?: unknown;
    }
}));

vi.mock('../../api/copilot/useChat', () => ({
    useChat: () => ({
        mutate: mocks.mutate,
        isPending: false
    })
}));

vi.mock('../draftStatus', () => ({
    subscribeToDraftStatus: mocks.subscribeToDraftStatus
}));

function HookHarness() {
    const { messages, draftStatusText, isDrafting, cancelCurrentDraft, tableResults } = useCopilotMessages();

    return React.createElement(
        'div',
        undefined,
        React.createElement('div', { 'data-testid': 'draft-status' }, draftStatusText),
        React.createElement('div', { 'data-testid': 'is-drafting' }, String(isDrafting)),
        React.createElement('div', { 'data-testid': 'table-results-count' }, String(tableResults?.length ?? 0)),
        React.createElement('button', { type: 'button', onClick: () => void cancelCurrentDraft() }, 'Cancel'),
        ...messages.map((message) =>
            React.createElement('div', { key: message.id, 'data-testid': `message-${message.role}` }, message.text)
        )
    );
}

describe('useCopilotMessages reload recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        mocks.subscribeToDraftStatus.mockReturnValue(() => undefined);
        mocks.cancelDraftJob.mockResolvedValue({
            requestId: 'draft_cancelled',
            status: 'cancelled',
            stage: 'cancelled',
            done: true,
            updatedAt: Date.now(),
            question: 'Cancelled draft',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now()
        });
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it('reattaches to an in-flight stored draft job after reload', async () => {
        window.localStorage.setItem('cooljoe.copilotTranscript', JSON.stringify([
            { id: 'assistant-1', role: 'assistant', text: 'Previous answer', mode: 'chat' }
        ]));
        window.localStorage.setItem('cooljoe.activeDraftSession', JSON.stringify({
            requestId: 'draft_1',
            statusToken: 'token_1',
            question: 'Show me revenue by month',
            intent: 'sql',
            startedAt: Date.now()
        }));
        mocks.getDraftJob.mockResolvedValue({
            requestId: 'draft_1',
            status: 'running',
            stage: 'planning_with_llm',
            attempt: 2,
            done: false,
            updatedAt: Date.now(),
            question: 'Show me revenue by month',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now()
        });

        render(React.createElement(HookHarness));

        await waitFor(() => {
            expect(mocks.getDraftJob).toHaveBeenCalledWith('draft_1', 'token_1');
        });
        await waitFor(() => {
            expect(mocks.subscribeToDraftStatus).toHaveBeenCalled();
        });

        expect(screen.getByTestId('is-drafting')).toHaveTextContent('true');
        expect(screen.getByTestId('draft-status')).toHaveTextContent('Planning with LLM (attempt 2)...');
        expect(screen.getByText('Previous answer')).toBeInTheDocument();
        expect(screen.getByText('Show me revenue by month')).toBeInTheDocument();
    });

    it('loads the persisted result immediately when the stored draft already completed', async () => {
        window.localStorage.setItem('cooljoe.activeDraftSession', JSON.stringify({
            requestId: 'draft_2',
            statusToken: 'token_2',
            question: 'Show me top customers',
            intent: 'sql',
            startedAt: Date.now()
        }));
        mocks.getDraftJob.mockResolvedValue({
            requestId: 'draft_2',
            status: 'completed',
            stage: 'completed',
            done: true,
            updatedAt: Date.now(),
            question: 'Show me top customers',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now(),
            resultStatus: 200,
            resultPayload: {
                intent: 'sql',
                sql: 'select * from customers',
                riskFlags: []
            }
        });

        render(React.createElement(HookHarness));

        await waitFor(() => {
            expect(screen.getByText("Here's the dataset you requested:")).toBeInTheDocument();
        });

        expect(mocks.subscribeToDraftStatus).not.toHaveBeenCalled();
        expect(screen.getByText('Show me top customers')).toBeInTheDocument();
        expect(window.localStorage.getItem('cooljoe.activeDraftSession')).toBeNull();
        expect(screen.getByTestId('is-drafting')).toHaveTextContent('false');
    });
});
