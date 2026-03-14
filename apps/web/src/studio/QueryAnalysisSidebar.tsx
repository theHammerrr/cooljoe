import type { QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';
import { QueryAnalysisIndexesSection } from './QueryAnalysisIndexesSection';
import { QueryAnalysisPlanNodeSummary } from './QueryAnalysisPlanNodeSummary';
import { QueryAnalysisPlanTree } from './QueryAnalysisPlanTree';
import { QueryAnalysisTableStatsSection } from './QueryAnalysisTableStatsSection';
import { findPlanNodeById } from './queryAnalysisPlanTreeHelpers';

interface QueryAnalysisSidebarProps {
    analysis: QueryAnalysisResult;
    selectedNodeId: string;
    onSelectNode: (nodeId: string) => void;
}

export function QueryAnalysisSidebar({ analysis, selectedNodeId, onSelectNode }: QueryAnalysisSidebarProps) {
    const selectedNode = findPlanNodeById(analysis.rawPlan, selectedNodeId);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(240px,0.95fr)_minmax(0,1.15fr)]">
                <QueryAnalysisPlanNodeSummary node={selectedNode} />
                <QueryAnalysisPlanTree root={analysis.rawPlan} selectedNodeId={selectedNode.nodeId} onSelectNode={onSelectNode} />
            </div>
            <QueryAnalysisIndexesSection indexes={analysis.indexes} />
            <QueryAnalysisTableStatsSection tableStats={analysis.tableStats} />
        </div>
    );
}
