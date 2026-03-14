import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';

export function findPlanNodeById(root: QueryAnalysisPlanNode, nodeId: string | null): QueryAnalysisPlanNode {
    if (!nodeId || root.nodeId === nodeId) {
        return root;
    }

    for (const plan of root.plans) {
        const match = findPlanNodeById(plan, nodeId);

        if (match.nodeId === nodeId) {
            return match;
        }
    }

    return root;
}

export function collectAncestorNodeIds(root: QueryAnalysisPlanNode, targetNodeId: string): string[] {
    const path = collectPath(root, targetNodeId);

    return path ?? [root.nodeId];
}

function collectPath(node: QueryAnalysisPlanNode, targetNodeId: string): string[] | null {
    if (node.nodeId === targetNodeId) {
        return [node.nodeId];
    }

    for (const child of node.plans) {
        const childPath = collectPath(child, targetNodeId);

        if (childPath) {
            return [node.nodeId, ...childPath];
        }
    }

    return null;
}
