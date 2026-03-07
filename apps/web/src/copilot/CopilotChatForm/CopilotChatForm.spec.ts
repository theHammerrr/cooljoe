/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CopilotChatForm } from './CopilotChatForm';

describe('CopilotChatForm', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it('restores persisted compose state after reload', () => {
        window.localStorage.setItem('cooljoe.copilotComposeState', JSON.stringify({
            input: 'Draft monthly revenue trend',
            mode: 'prisma'
        }));

        const handleSend = vi.fn();
        render(React.createElement(CopilotChatForm, { onSend: handleSend, disabled: false }));

        expect(screen.getByPlaceholderText(/Ask about your data/i)).toHaveValue('Draft monthly revenue trend');
        expect(screen.getByRole('combobox')).toHaveValue('prisma');
    });
});
