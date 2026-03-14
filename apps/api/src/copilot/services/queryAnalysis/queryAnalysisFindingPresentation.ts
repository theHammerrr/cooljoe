import type { QueryAnalysisFinding, QueryAnalysisPlanNode } from './types';
import { findFocusNodeId } from './queryAnalysisFindingFocus';
import { classifyReasonableness } from './queryAnalysisFindingReasonableness';

export function attachFindingPresentation(findings: QueryAnalysisFinding[], planNodes: QueryAnalysisPlanNode[]): QueryAnalysisFinding[] {
    return findings.map((finding) => {
        const focusNodeId = finding.runtimeContext?.nodeId || findFocusNodeId(finding, planNodes);
        const focusNode = focusNodeId ? planNodes.find((node) => node.nodeId === focusNodeId) : undefined;
        const presentation = classifyReasonableness(finding, focusNode);

        return {
            ...finding,
            focusNodeId,
            reasonableness: presentation.reasonableness,
            reasonablenessExplanation: presentation.explanation
        };
    });
}
