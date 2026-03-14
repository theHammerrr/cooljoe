import type { QueryAnalysisFinding, QueryAnalysisPlanNode } from './types';

export function findFocusNodeId(finding: QueryAnalysisFinding, planNodes: QueryAnalysisPlanNode[]): string | undefined {
    if (finding.category === 'sort') {
        return planNodes.find((node) => node.nodeType.includes('Sort'))?.nodeId;
    }

    if (finding.category === 'join') {
        return findBySqlReference(finding, planNodes, ['Nested Loop', 'Hash Join', 'Merge Join']);
    }

    if (finding.category === 'scan' || finding.category === 'index') {
        return findByTableReference(finding, planNodes) || findBySqlReference(finding, planNodes, ['Seq Scan', 'Index Scan', 'Index Only Scan', 'Bitmap Heap Scan', 'Bitmap Index Scan']);
    }

    return planNodes[0]?.nodeId;
}

function findByTableReference(finding: QueryAnalysisFinding, planNodes: QueryAnalysisPlanNode[]): string | undefined {
    const tableNames = extractTableNames(finding);

    return planNodes.find((node) => {
        if (!node.relationName) return false;
        const qualifiedName = `${node.schema ? `${node.schema}.` : ''}${node.relationName}`;

        return tableNames.includes(qualifiedName) || tableNames.includes(node.relationName);
    })?.nodeId;
}

function findBySqlReference(finding: QueryAnalysisFinding, planNodes: QueryAnalysisPlanNode[], nodeTypes: string[]): string | undefined {
    const references = finding.sqlReferences || [];

    return planNodes.find((node) =>
        nodeTypes.includes(node.nodeType)
        && references.some((reference) => node.sqlReferences.some((nodeReference) => nodeReference.includes(reference) || reference.includes(nodeReference)))
    )?.nodeId;
}

function extractTableNames(finding: QueryAnalysisFinding): string[] {
    const matches = new Set<string>();

    for (const source of [finding.title, ...finding.evidence]) {
        for (const match of source.matchAll(/\b([a-z_][\w]*\.[a-z_][\w]*)\b/gi)) {
            matches.add(match[1]);
        }
    }

    return [...matches];
}
