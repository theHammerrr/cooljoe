/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatMessage } from './ChatMessage';
import type { CopilotMessage } from './types';

const mocks = vi.hoisted(() => ({
    runQueryMutate: vi.fn(),
    acceptQueryMutate: vi.fn(),
    allowTableMutate: vi.fn()
}));

vi.mock('../api/copilot/useRunQuery', () => ({
    useRunQuery: () => ({
        mutate: mocks.runQueryMutate,
        isPending: false
    })
}));

vi.mock('../api/copilot/useAcceptQuery', () => ({
    useAcceptQuery: () => ({
        mutate: mocks.acceptQueryMutate
    })
}));

vi.mock('../api/copilot/useAllowTable', () => ({
    useAllowTable: () => ({
        mutate: mocks.allowTableMutate,
        isPending: false
    })
}));

const baseMessage: CopilotMessage = {
    id: 'assistant-1',
    role: 'assistant',
    text: "Here's the dataset you requested:",
    mode: 'sql',
    queryBlock: {
        intent: 'employee lookup',
        sql: 'select * from employee',
        riskFlags: []
    }
};

describe('ChatMessage notifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('emits an in-app success notice when a query recipe is saved', () => {
        mocks.acceptQueryMutate.mockImplementation((_params, options) => {
            options.onSuccess({ success: true });
        });
        const onNotify = vi.fn();

        render(
            React.createElement(ChatMessage, {
                msg: baseMessage,
                previousUserMessageText: 'get employees',
                onResults: vi.fn(),
                onUpdateMessage: vi.fn(),
                onNotify
            })
        );

        fireEvent.click(screen.getByText('Accept'));

        expect(onNotify).toHaveBeenCalledWith('Query recipe saved.', 'success');
    });

    it('emits an in-app error notice when allowing a table fails', () => {
        mocks.allowTableMutate.mockImplementation((_params, options) => {
            options.onError(new Error('Allowlist update failed.'));
        });
        const onNotify = vi.fn();

        render(
            React.createElement(ChatMessage, {
                msg: {
                    ...baseMessage,
                    requiresApproval: true,
                    tableName: 'employee'
                },
                previousUserMessageText: 'get employees',
                onResults: vi.fn(),
                onUpdateMessage: vi.fn(),
                onNotify
            })
        );

        fireEvent.click(screen.getByText('Allow & Run'));

        expect(onNotify).toHaveBeenCalledWith('Allowlist update failed.', 'error');
    });
});
