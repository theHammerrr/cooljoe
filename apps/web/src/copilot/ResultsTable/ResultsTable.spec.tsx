/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ResultsTable } from './ResultsTable';

vi.mock('../../api/copilot/useExportExcel', () => ({
    useExportExcel: () => ({
        mutate: vi.fn(),
        isPending: false
    })
}));

describe('ResultsTable', () => {
    it('renders empty state and clears workspace', () => {
        const onClear = vi.fn();
        render(React.createElement(ResultsTable, { tableResults: [], onClear }));

        fireEvent.click(screen.getByRole('button', { name: /Reset Workspace/i }));

        expect(onClear).toHaveBeenCalledTimes(1);
    });
});
