import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';
import { getPlanNodeMetadata } from './queryAnalysisPlanMetadata';

export interface QueryAnalysisPlanNarrative {
    title: string;
    summary: string;
    sqlReference: string;
    watchItems: string[];
}

export function getPlanNodeNarrative(node: QueryAnalysisPlanNode): QueryAnalysisPlanNarrative {
    const metadata = getPlanNodeMetadata(node);
    const sqlReference = node.sqlReferences[0] || metadata.sqlReference;

    return {
        title: getNarrativeTitle(node),
        summary: metadata.meaning,
        sqlReference,
        watchItems: getWatchItems(node)
    };
}

function getNarrativeTitle(node: QueryAnalysisPlanNode): string {
    if (node.relationName) {
        return `${node.nodeType} on ${node.schema ? `${node.schema}.` : ''}${node.relationName}`;
    }

    return node.nodeType;
}

function getWatchItems(node: QueryAnalysisPlanNode): string[] {
    const items: string[] = [];

    if (node.filter) items.push(`Review the filter shape: ${node.filter}`);

    if (node.indexCond) items.push(`Index condition in play: ${node.indexCond}`);

    if (node.joinFilter) items.push(`Join filter is applied here: ${node.joinFilter}`);

    if (node.hashCond) items.push(`Hash condition drives this join: ${node.hashCond}`);

    if (node.mergeCond) items.push(`Merge condition drives this step: ${node.mergeCond}`);

    if (node.sortKey?.length) items.push(`Ordering depends on: ${node.sortKey.join(', ')}`);

    if (node.indexName) items.push(`Current access path uses index ${node.indexName}.`);

    if (typeof node.actualRows === 'number' && typeof node.planRows === 'number' && node.planRows > 0) {
        const drift = node.actualRows / node.planRows;

        if (drift >= 5) {
            items.push('Actual rows are much higher than estimated. Check selectivity assumptions or stale stats.');
        } else if (drift <= 0.2) {
            items.push('Actual rows are much lower than estimated. The planner may be overestimating this branch.');
        }
    }

    if (items.length === 0) {
        items.push('Use this node to confirm whether the SQL fragment and access path match the optimizer choice you expected.');
    }

    return items.slice(0, 3);
}
