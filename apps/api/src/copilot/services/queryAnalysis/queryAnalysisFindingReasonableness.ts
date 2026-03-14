import type { QueryAnalysisFinding, QueryAnalysisPlanNode } from './types';

const LARGE_PLAN_ROWS = 1000;
const LARGE_RUNTIME_MS = 25;

export function classifyReasonableness(finding: QueryAnalysisFinding, focusNode?: QueryAnalysisPlanNode): {
    reasonableness: NonNullable<QueryAnalysisFinding['reasonableness']>;
    explanation: string;
} {
    if (finding.runtimeContext) {
        return {
            reasonableness: 'high_priority',
            explanation: 'Observed runtime drift or actual execution metrics show this node is already expensive in practice.'
        };
    }

    if (!focusNode) {
        if (finding.severity === 'high' || finding.evidenceSources.includes('plan')) {
            return {
                reasonableness: 'worth_investigating',
                explanation: 'This finding is backed by plan evidence, but it is not yet tied to a specific high-pressure node.'
            };
        }

        return {
            reasonableness: 'likely_reasonable',
            explanation: 'This is currently metadata or SQL-shape guidance without a strong plan-pressure signal.'
        };
    }

    if (isIndexedAccessNode(focusNode)) {
        return {
            reasonableness: 'likely_reasonable',
            explanation: `The mapped node already uses an index-driven access path (${focusNode.nodeType}), so the planner choice may be acceptable.`
        };
    }

    if (isLowPressureNode(focusNode)) {
        return {
            reasonableness: 'likely_reasonable',
            explanation: buildLowPressureExplanation(focusNode)
        };
    }

    if (isHighPressureNode(focusNode)) {
        return {
            reasonableness: finding.severity === 'high' ? 'high_priority' : 'worth_investigating',
            explanation: buildHighPressureExplanation(focusNode, finding.severity === 'high')
        };
    }

    if (focusNode.nodeType === 'Seq Scan' || focusNode.nodeType.includes('Sort') || focusNode.nodeType.includes('Join') || focusNode.nodeType === 'Nested Loop') {
        return {
            reasonableness: 'worth_investigating',
            explanation: `This maps to a ${focusNode.nodeType} node, which is often worth reviewing even without extreme row or runtime pressure.`
        };
    }

    return finding.isHeuristic
        ? {
            reasonableness: 'likely_reasonable',
            explanation: 'This is a heuristic recommendation without strong plan-pressure evidence behind it.'
        }
        : {
            reasonableness: 'worth_investigating',
            explanation: 'This deterministic finding does not look urgent, but it is still worth checking.'
        };
}

function isIndexedAccessNode(node: QueryAnalysisPlanNode): boolean {
    return node.nodeType === 'Index Scan' || node.nodeType === 'Index Only Scan' || node.nodeType === 'Bitmap Index Scan';
}

function isLowPressureNode(node: QueryAnalysisPlanNode): boolean {
    const totalRows = getObservedRows(node);
    const totalTime = node.actualTotalTime;

    if (typeof totalTime === 'number' && totalTime < LARGE_RUNTIME_MS) {
        return true;
    }

    return typeof totalRows === 'number' && totalRows < LARGE_PLAN_ROWS;
}

function isHighPressureNode(node: QueryAnalysisPlanNode): boolean {
    const totalRows = getObservedRows(node);
    const totalTime = node.actualTotalTime;

    if (typeof totalTime === 'number' && totalTime >= LARGE_RUNTIME_MS) {
        return true;
    }

    return typeof totalRows === 'number' && totalRows >= LARGE_PLAN_ROWS;
}

function getObservedRows(node: QueryAnalysisPlanNode): number | undefined {
    if (typeof node.actualRows === 'number') return Math.max(node.actualRows * Math.max(node.actualLoops || 1, 1), 0);

    return node.planRows;
}

function buildLowPressureExplanation(node: QueryAnalysisPlanNode): string {
    if (typeof node.actualTotalTime === 'number' && node.actualTotalTime < LARGE_RUNTIME_MS) {
        return `The mapped ${node.nodeType} node currently reports low runtime (${node.actualTotalTime.toFixed(3)} ms), so the planner choice may be fine.`;
    }

    if (typeof getObservedRows(node) === 'number') {
        return `The mapped ${node.nodeType} node touches a relatively small row set (${Math.round(getObservedRows(node) || 0)} rows), so this may not be worth optimizing yet.`;
    }

    return `The mapped ${node.nodeType} node does not show strong pressure signals, so the planner choice may be acceptable.`;
}

function buildHighPressureExplanation(node: QueryAnalysisPlanNode, isHighSeverity: boolean): string {
    if (typeof node.actualTotalTime === 'number' && node.actualTotalTime >= LARGE_RUNTIME_MS) {
        return `The mapped ${node.nodeType} node is already expensive at runtime (${node.actualTotalTime.toFixed(3)} ms), so optimization is likely worth it${isHighSeverity ? ' now' : ''}.`;
    }

    if (typeof getObservedRows(node) === 'number') {
        return `The mapped ${node.nodeType} node processes a large row set (${Math.round(getObservedRows(node) || 0)} rows), so this is likely worth optimizing${isHighSeverity ? ' first' : ''}.`;
    }

    return `The mapped ${node.nodeType} node looks like a high-pressure part of the plan, so this is likely worth reviewing closely.`;
}
