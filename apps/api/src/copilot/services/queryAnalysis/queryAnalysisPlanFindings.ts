import type {
    QueryAnalysisFinding,
    QueryAnalysisIndexMetadata,
    QueryAnalysisPlanNode,
    QueryAnalysisTableStats
} from './types';
import {
    formatEstimatedRowsEvidence,
    getEstimatedTableRows,
    shouldSuppressMetadataFinding
} from './queryAnalysisTableStats';

export function appendPlanNodeFindings(
    findings: QueryAnalysisFinding[],
    node: QueryAnalysisPlanNode,
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): void {
    if (node.nodeType === 'Seq Scan' && node.relationName) {
        appendSequentialScanFinding(findings, node, indexes, tableStats);
    }

    if (node.nodeType === 'Sort' && (node.planRows || 0) >= 1000) {
        findings.push({
            severity: 'medium',
            category: 'sort',
            title: 'Large sort operation detected',
            evidence: [`Planner expects to sort approximately ${node.planRows} rows.`, ...(node.sortKey?.length ? [`Sort keys: ${node.sortKey.join(', ')}`] : [])],
            evidenceSources: ['plan'],
            suggestion: 'Reduce the row set before sorting, or align filtering and ordering with an existing index when possible.',
            confidence: 'medium',
            isHeuristic: true
        });
    }

    if (node.nodeType === 'Nested Loop' && (node.planRows || 0) >= 1000) {
        findings.push({
            severity: 'medium',
            category: 'join',
            title: 'Nested loop over a large estimated row set',
            evidence: [`Planner expects approximately ${node.planRows} rows through this nested loop.`],
            evidenceSources: ['plan'],
            suggestion: 'Review join selectivity and supporting indexes on join keys. Large nested loops often indicate missing indexes or filters applied too late.',
            confidence: 'medium',
            isHeuristic: true
        });
    }
}

export function flattenPlan(node: QueryAnalysisPlanNode): QueryAnalysisPlanNode[] {
    return [node, ...node.plans.flatMap((entry) => flattenPlan(entry))];
}

function appendSequentialScanFinding(
    findings: QueryAnalysisFinding[],
    node: QueryAnalysisPlanNode,
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[]
): void {
    const qualifiedTable = qualifyPlanTable(node);
    const estimatedTableRows = getEstimatedTableRows(tableStats, qualifiedTable);
    const relatedIndexes = indexes.filter((index) => `${index.schemaName}.${index.tableName}` === qualifiedTable);
    const evidence = [`Planner chose a sequential scan on ${qualifiedTable}.`];

    if (typeof node.planRows === 'number') {
        evidence.push(`Estimated rows scanned: ${node.planRows}.`);
    }

    evidence.push(...formatEstimatedRowsEvidence(estimatedTableRows));

    if (node.filter) {
        evidence.push(`Filter: ${node.filter}`);
    }

    if (shouldSuppressMetadataFinding(estimatedTableRows) && (node.planRows || 0) < 500) {
        return;
    }

    findings.push({
        severity: node.planRows && node.planRows > 1000 ? 'high' : 'medium',
        category: 'scan',
        title: `Sequential scan on ${qualifiedTable}`,
        evidence,
        evidenceSources: relatedIndexes.length > 0 ? ['plan', 'metadata'] : ['plan'],
        suggestion: relatedIndexes.length > 0
            ? `Check whether the predicate shape can use an existing index on ${qualifiedTable}, or simplify expressions/casts in the filter.`
            : `Consider adding an index that supports the filter or join predicates on ${qualifiedTable}.`,
        confidence: 'medium',
        isHeuristic: true
    });
}

function qualifyPlanTable(node: QueryAnalysisPlanNode): string {
    if (node.schema && node.relationName) {
        return `${node.schema}.${node.relationName}`;
    }

    return node.relationName || 'unknown_table';
}
