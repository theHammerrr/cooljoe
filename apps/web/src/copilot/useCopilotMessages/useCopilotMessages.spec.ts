/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopilotMessages } from './useCopilotMessages';
import { DraftQueryApiError } from '../../api/copilot/useDraftQuery';

const mocks = vi.hoisted(() => ({
    createDraftJob: vi.fn(),
    cancelDraftJob: vi.fn(),
    getDraftJob: vi.fn(),
    subscribeToDraftStatus: vi.fn(),
    sendChat: vi.fn()
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
        sendChat: mocks.sendChat,
        isPending: false
    })
}));

vi.mock('../draftStatus', () => ({
    subscribeToDraftStatus: mocks.subscribeToDraftStatus
}));

function HookHarness() {
    const { messages, draftStatusText, isDrafting, cancelCurrentDraft, tableResults, runDraft } = useCopilotMessages();

    return React.createElement(
        'div',
        undefined,
        React.createElement('div', { 'data-testid': 'draft-status' }, draftStatusText),
        React.createElement('div', { 'data-testid': 'is-drafting' }, String(isDrafting)),
        React.createElement('div', { 'data-testid': 'table-results-count' }, String(tableResults?.length ?? 0)),
        React.createElement('button', { type: 'button', onClick: () => void cancelCurrentDraft() }, 'Cancel'),
        React.createElement('button', { type: 'button', onClick: () => runDraft('Retryable draft', 'sql', 'retry constraints') }, 'RunDraft'),
        ...messages.map((message) =>
            React.createElement('div', { key: message.id, 'data-testid': `message-${message.role}` }, message.text)
        )
    );
}

describe('useCopilotMessages reload recovery', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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
        consoleErrorSpy.mockRestore();
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
                kind: 'query',
                query: {
                    intent: 'sql',
                    sql: 'select * from customers',
                    riskFlags: []
                }
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

    it('removes stale retry failure messages before a successful retry result is appended', async () => {
        const initialError = new DraftQueryApiError('Failed to draft query');

        initialError.issues = ['Plan referenced column "nitzan.job.description" outside the narrowed candidate column scope.'];

        mocks.createDraftJob.mockRejectedValueOnce(initialError);
        mocks.createDraftJob.mockResolvedValueOnce({
            requestId: 'draft_success',
            statusToken: 'token_success',
            expiresAt: Date.now() + 60_000
        });
        mocks.getDraftJob.mockResolvedValue({
            requestId: 'draft_success',
            status: 'completed',
            stage: 'completed',
            done: true,
            updatedAt: Date.now(),
            question: 'Retryable draft',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now(),
            resultStatus: 200,
            resultPayload: {
                kind: 'query',
                query: {
                    intent: 'sql',
                    sql: 'select name from employee',
                    riskFlags: []
                }
            }
        });
        mocks.subscribeToDraftStatus.mockImplementation((_requestId, _statusToken, _setStatusText, onDone) => {
            void onDone();

            return () => undefined;
        });

        render(React.createElement(HookHarness));

        await act(async () => {
            screen.getByText('RunDraft').click();
        });

        await waitFor(() => {
            expect(screen.getByText(/couldn't generate a query/i)).toBeInTheDocument();
        });

        await act(async () => {
            screen.getByText('RunDraft').click();
        });

        await waitFor(() => {
            expect(screen.getByText("Here's the dataset you requested:")).toBeInTheDocument();
        });

        expect(screen.queryByText(/couldn't generate a query/i)).not.toBeInTheDocument();
    });

    it('ignores duplicate completion callbacks for the same draft request', async () => {
        mocks.createDraftJob.mockResolvedValueOnce({
            requestId: 'draft_dupe',
            statusToken: 'token_dupe',
            expiresAt: Date.now() + 60_000
        });
        mocks.getDraftJob.mockResolvedValue({
            requestId: 'draft_dupe',
            status: 'completed',
            stage: 'completed',
            done: true,
            updatedAt: Date.now(),
            question: 'Retryable draft',
            preferredMode: 'sql',
            recoveryCount: 0,
            createdAt: Date.now(),
            resultStatus: 200,
            resultPayload: {
                kind: 'query',
                query: {
                    intent: 'sql',
                    sql: 'select employee_name from employee',
                    riskFlags: []
                }
            }
        });
        mocks.subscribeToDraftStatus.mockImplementation((_requestId, _statusToken, _setStatusText, onDone) => {
            void onDone();
            void onDone();

            return () => undefined;
        });

        render(React.createElement(HookHarness));

        await act(async () => {
            screen.getByText('RunDraft').click();
        });

        await waitFor(() => {
            expect(screen.getAllByText("Here's the dataset you requested:")).toHaveLength(1);
        });
        expect(mocks.getDraftJob).toHaveBeenCalledTimes(1);
    });
});
