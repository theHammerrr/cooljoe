import type { QueryAnalysisFinding } from '../api/copilot/useAnalyzeQuery';
import { QueryAnalysisFindingCard } from './QueryAnalysisFindingCard';

interface QueryAnalysisFindingsSectionProps {
    findings: QueryAnalysisFinding[];
    onSelectNode: (nodeId: string) => void;
    selectedNodeId: string;
}

export function QueryAnalysisFindingsSection({ findings, onSelectNode, selectedNodeId }: QueryAnalysisFindingsSectionProps) {
    return (
        <div className="space-y-3">
            {findings.length === 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
                    No obvious issues were detected in the first-pass analyzer. Review the raw plan before trusting that as "fast enough".
                </div>
            )}
            {findings.map((finding) => <QueryAnalysisFindingCard key={`${finding.category}:${finding.title}`} finding={finding} onSelectNode={onSelectNode} selectedNodeId={selectedNodeId} />)}
        </div>
    );
}
