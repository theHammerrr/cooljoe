import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';
import { getPlanNodeMetadata } from './queryAnalysisPlanMetadata';
import { getPlanPressure, getPlanPressureClassName } from './queryAnalysisPlanPressure';

interface QueryAnalysisPlanTreeNodeProps {
    node: QueryAnalysisPlanNode;
    depth: number;
    expandedNodeIds: Set<string>;
    visibleExpandedNodeIds: Set<string>;
    ancestorNodeIdSet: Set<string>;
    selectedNodeId: string;
    onSelectNode: (nodeId: string) => void;
    onToggleNode: (nodeId: string) => void;
}

export function QueryAnalysisPlanTreeNode({
    node,
    depth,
    expandedNodeIds,
    visibleExpandedNodeIds,
    ancestorNodeIdSet,
    selectedNodeId,
    onSelectNode,
    onToggleNode
}: QueryAnalysisPlanTreeNodeProps) {
    const isSelected = node.nodeId === selectedNodeId;
    const isOnSelectedPath = ancestorNodeIdSet.has(node.nodeId);
    const isExpanded = visibleExpandedNodeIds.has(node.nodeId);
    const metadata = getPlanNodeMetadata(node);
    const pressure = getPlanPressure(node);
    const primarySqlReference = node.sqlReferences[0] || metadata.sqlReference;

    return (
        <div className={`rounded-lg ${isOnSelectedPath ? 'border-l-2 border-cyan-400/40 pl-2' : ''}`}>
            <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 transition-colors ${
                    isSelected
                        ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-50'
                        : isOnSelectedPath
                            ? 'border-cyan-500/20 bg-cyan-500/5 text-slate-200'
                            : 'border-white/5 bg-black/20 text-slate-300 hover:border-white/10 hover:bg-white/5'
                }`}
            >
                <div className="flex items-start gap-2 min-w-0 flex-1" style={{ paddingLeft: `${depth * 18}px` }}>
                    {node.plans.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => onToggleNode(node.nodeId)}
                            className="mt-0.5 h-6 w-6 shrink-0 rounded-md border border-white/10 bg-black/20 text-[10px] text-slate-300 transition-colors hover:text-white"
                            aria-label={isExpanded ? 'Collapse branch' : 'Expand branch'}
                        >
                            {expandedNodeIds.has(node.nodeId) ? '-' : '+'}
                        </button>
                    ) : (
                        <span className="mt-1 block h-6 w-6 shrink-0 text-center text-[10px] text-slate-600">.</span>
                    )}
                    <button
                        type="button"
                        onClick={() => onSelectNode(node.nodeId)}
                        className="min-w-0 flex-1 text-left"
                        title={`${metadata.meaning} ${primarySqlReference}`}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{node.nodeType}</p>
                            <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getPlanPressureClassName(pressure)}`}>
                                {pressure}
                            </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            {node.relationName ? `${node.schema ? `${node.schema}.` : ''}${node.relationName}` : node.nodeId}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">{primarySqlReference}</p>
                    </button>
                </div>
                <div className="ml-auto shrink-0 text-right text-[11px] text-slate-400">
                    {typeof node.planRows === 'number' && <p>est {node.planRows.toLocaleString()}</p>}
                    {typeof node.actualRows === 'number' && <p>act {node.actualRows.toLocaleString()}</p>}
                    {typeof node.actualTotalTime === 'number' && <p>{node.actualTotalTime.toFixed(2)} ms</p>}
                </div>
            </div>
            {node.plans.length > 0 && isExpanded && (
                <div className="mt-2 space-y-2 border-l border-white/6 pl-2">
                    {node.plans.map((child) => (
                        <QueryAnalysisPlanTreeNode
                            key={child.nodeId}
                            node={child}
                            depth={depth + 1}
                            expandedNodeIds={expandedNodeIds}
                            visibleExpandedNodeIds={visibleExpandedNodeIds}
                            ancestorNodeIdSet={ancestorNodeIdSet}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                            onToggleNode={onToggleNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
