import type { QueryAnalysisFinding, QueryAnalysisMode, QueryAnalysisPlanNode } from './types';

const ESTIMATE_DRIFT_RATIO = 10;
const MIN_ACTUAL_ROWS_FOR_DRIFT = 100;
const MIN_ACTUAL_TIME_MS = 25;

export function buildRuntimeFindings(planNodes: QueryAnalysisPlanNode[], mode: QueryAnalysisMode): QueryAnalysisFinding[] {
    if (mode !== 'explain_analyze') {
        return [];
    }

    const findings: QueryAnalysisFinding[] = [];

    for (const node of planNodes) {
        appendEstimateDriftFinding(findings, node);
    }

    return findings;
}

function appendEstimateDriftFinding(findings: QueryAnalysisFinding[], node: QueryAnalysisPlanNode): void {
    if (
        typeof node.planRows !== 'number'
        || typeof node.actualRows !== 'number'
        || typeof node.actualLoops !== 'number'
        || typeof node.actualTotalTime !== 'number'
    ) {
        return;
    }

    const estimatedRows = Math.max(node.planRows, 1);
    const actualRows = Math.max(node.actualRows * Math.max(node.actualLoops, 1), 1);
    const driftRatio = Math.max(actualRows / estimatedRows, estimatedRows / actualRows);

    if (driftRatio < ESTIMATE_DRIFT_RATIO || actualRows < MIN_ACTUAL_ROWS_FOR_DRIFT || node.actualTotalTime < MIN_ACTUAL_TIME_MS) {
        return;
    }

    findings.push({
        severity: driftRatio >= 50 ? 'high' : 'medium',
        category: getNodeCategory(node),
        title: `${node.nodeType} row estimate drift detected`,
        evidence: [
            `Estimated rows: ${node.planRows}.`,
            `Actual rows across loops: ${Math.round(actualRows)}.`,
            `Actual loops: ${node.actualLoops}.`,
            `Actual total time: ${node.actualTotalTime.toFixed(3)} ms.`,
            `Planner estimates differ from observed execution by about ${driftRatio.toFixed(1)}x.`
        ],
        evidenceSources: ['plan'],
        runtimeContext: {
            nodeId: node.nodeId,
            nodeType: node.nodeType,
            estimatedRows: node.planRows,
            actualRows: Math.round(actualRows),
            actualLoops: node.actualLoops,
            actualTotalTimeMs: Number(node.actualTotalTime.toFixed(3)),
            driftRatio: Number(driftRatio.toFixed(1))
        },
        suggestion: 'Refresh table statistics with ANALYZE if they may be stale, and review predicate selectivity or correlated filters that the planner may be estimating poorly.',
        confidence: 'high',
        isHeuristic: false
    });
}

function getNodeCategory(node: QueryAnalysisPlanNode): QueryAnalysisFinding['category'] {
    if (node.nodeType.includes('Join') || node.nodeType === 'Nested Loop') {
        return 'join';
    }

    if (node.nodeType === 'Sort') {
        return 'sort';
    }

    return 'scan';
}
