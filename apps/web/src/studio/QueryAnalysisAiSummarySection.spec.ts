/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { QueryAnalysisResult } from '../api/copilot/queryAnalysisTypes';
import { QueryAnalysisAiSummarySection } from './QueryAnalysisAiSummarySection';

const analysis: QueryAnalysisResult = {
    success: true,
    mode: 'explain',
    normalizedSql: 'select * from employee limit 10',
    referencedTables: ['employee'],
    indexes: [],
    tableStats: [],
    safetyNotes: [],
    aiSummary: { summary: 'Use an index.', suggestions: ['Add index'], disclaimer: 'Validate it.' },
    findings: [],
    rawPlan: { nodeId: '0:limit', nodeType: 'Limit', sqlReferences: ['LIMIT 10'], planRows: 10, plans: [] }
};

describe('QueryAnalysisAiSummarySection', () => {
    it('starts collapsed and expands on demand', () => {
        render(React.createElement(QueryAnalysisAiSummarySection, { aiSummary: analysis.aiSummary, analysis }));

        expect(screen.getByRole('button', { name: /show ai/i })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Use an index.')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /show ai/i }));

        expect(screen.getByRole('button', { name: /hide ai/i })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Use an index.')).toBeInTheDocument();
        expect(screen.getByText('Why The Model Said This')).toBeInTheDocument();
    });
});
