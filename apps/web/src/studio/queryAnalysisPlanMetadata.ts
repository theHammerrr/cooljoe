import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';
import { PLAN_METADATA_BY_TYPE } from './queryAnalysisPlanMetadataData';

interface QueryAnalysisPlanMetadata {
    meaning: string;
    sqlReference: string;
}

export function getPlanNodeMetadata(node: QueryAnalysisPlanNode): QueryAnalysisPlanMetadata {
    const metadata = PLAN_METADATA_BY_TYPE[node.nodeType];

    if (metadata) {
        return {
            meaning: metadata.meaning,
            sqlReference: metadata.sqlReference.replaceAll('{relation}', formatRelation(node))
        };
    }

    return {
        meaning: 'Planner/executor step used to produce the final result.',
        sqlReference: 'Usually tied to some combination of FROM, WHERE, JOIN, GROUP BY, ORDER BY, or LIMIT.'
    };
}

function formatRelation(node: QueryAnalysisPlanNode): string {
    if (node.relationName) {
        return `${node.schema ? `${node.schema}.` : ''}${node.relationName}`;
    }

    return 'the referenced relation';
}
