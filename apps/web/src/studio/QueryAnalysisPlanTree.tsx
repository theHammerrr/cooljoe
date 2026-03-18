import { useMemo, useState } from 'react';
import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';
import { QueryAnalysisPlanTreeLegend } from './QueryAnalysisPlanTreeLegend';
import { QueryAnalysisPlanTreeNode } from './QueryAnalysisPlanTreeNode';
import { collectAncestorNodeIds } from './queryAnalysisPlanTreeHelpers';

interface QueryAnalysisPlanTreeProps {
    root: QueryAnalysisPlanNode;
    selectedNodeId: string;
    onSelectNode: (nodeId: string) => void;
}

export function QueryAnalysisPlanTree({ root, selectedNodeId, onSelectNode }: QueryAnalysisPlanTreeProps) {
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set([root.nodeId]));
    const ancestorNodeIds = useMemo(() => collectAncestorNodeIds(root, selectedNodeId), [root, selectedNodeId]);
    const ancestorNodeIdSet = new Set(ancestorNodeIds);
    const visibleExpandedNodeIds = useMemo(() => new Set([...expandedNodeIds, ...ancestorNodeIds]), [expandedNodeIds, ancestorNodeIds]);

    return (
        <section className="rounded-xl border border-white/5 bg-[#161b22] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Plan Tree</p>
                    <p className="mt-2 text-sm text-slate-400">Trace the selected path, inspect row pressure, and expand deeper branches only when needed.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setExpandedNodeIds(new Set([root.nodeId]))}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:text-slate-100"
                >
                    Reset Tree
                </button>
            </div>
            <QueryAnalysisPlanTreeLegend />
            <div className="mt-4 max-h-[34rem] space-y-2 overflow-auto pr-1">
                <QueryAnalysisPlanTreeNode
                    node={root}
                    depth={0}
                    expandedNodeIds={expandedNodeIds}
                    visibleExpandedNodeIds={visibleExpandedNodeIds}
                    ancestorNodeIdSet={ancestorNodeIdSet}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    onToggleNode={(nodeId) => toggleExpandedNode(setExpandedNodeIds, nodeId)}
                />
            </div>
        </section>
    );
}

function toggleExpandedNode(
    setExpandedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>,
    nodeId: string
): void {
    setExpandedNodeIds((current) => {
        const next = new Set(current);

        if (next.has(nodeId)) {
            next.delete(nodeId);
        } else {
            next.add(nodeId);
        }

        return next;
    });
}
