/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import type { QueryAnalysisFinding, QueryAnalysisPlanNode, QueryAnalysisResult } from '../api/copilot/queryAnalysisTypes';
import { QueryAnalysisFindingCard } from './QueryAnalysisFindingCard';
import { QueryAnalysisSidebar } from './QueryAnalysisSidebar';

const childNode: QueryAnalysisPlanNode = {
    nodeId: '0:scan',
    nodeType: 'Seq Scan',
    relationName: 'employee',
    schema: 'public',
    sqlReferences: ['FROM employee WHERE status = \'active\''],
    filter: 'status = \'active\'',
    planRows: 120,
    actualRows: 6000,
    actualTotalTime: 18.2,
    plans: []
};

const analysis: QueryAnalysisResult = {
    success: true,
    mode: 'explain_analyze',
    normalizedSql: 'select * from employee where status = \'active\' limit 100',
    referencedTables: ['employee'],
    indexes: [],
    tableStats: [],
    safetyNotes: ['EXPLAIN ANALYZE executes the query.'],
    aiSummary: null,
    findings: [],
    rawPlan: { nodeId: '0:limit', nodeType: 'Limit', sqlReferences: ['LIMIT 100'], planRows: 100, actualRows: 100, plans: [childNode] }
};

const finding: QueryAnalysisFinding = {
    severity: 'high',
    category: 'scan',
    reasonableness: 'high_priority',
    reasonablenessExplanation: 'Large scan on a selective filter.',
    title: 'Sequential scan on employee',
    evidence: ['The plan reads many rows before applying the filter.'],
    evidenceSources: ['plan'],
    sqlReferences: ['WHERE status = \'active\''],
    focusNodeId: '0:scan',
    suggestion: 'Add an index on employee(status).',
    confidence: 'high',
    isHeuristic: false
};

describe('Query analysis inspector', () => {
    it('shows the narrative node summary and selected path', () => {
        render(React.createElement(QueryAnalysisSidebar, { analysis, selectedNodeId: '0:scan', onSelectNode: vi.fn() }));

        expect(screen.getByText('Seq Scan on public.employee')).toBeInTheDocument();
        expect(screen.getByText(/Reads the whole table row by row/i)).toBeInTheDocument();
        expect(screen.getByText(/What To Look At Next/i)).toBeInTheDocument();
        expect(screen.getByText(/Review the filter shape/i)).toBeInTheDocument();
        expect(screen.getByText(/High Pressure/i)).toBeInTheDocument();
    });

    it('keeps finding details collapsed until requested and focuses the mapped node', () => {
        const onSelectNode = vi.fn();
        render(React.createElement(QueryAnalysisFindingCard, { finding, onSelectNode, selectedNodeId: '0:limit' }));

        expect(screen.queryByText(/The plan reads many rows/i)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /focus node/i }));
        expect(onSelectNode).toHaveBeenCalledWith('0:scan');

        fireEvent.click(screen.getByRole('button', { name: /details/i }));
        expect(screen.getByText(/The plan reads many rows/i)).toBeInTheDocument();
        expect(screen.getByText('WHERE status = \'active\'')).toBeInTheDocument();
    });
});
