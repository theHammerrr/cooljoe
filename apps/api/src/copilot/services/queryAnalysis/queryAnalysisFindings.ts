import type { QueryAnalysisFinding, QueryAnalysisIndexMetadata, QueryAnalysisPlanNode } from './types';
import { extractQueryJoins, extractQueryPredicates } from './queryAnalysisAst';
import { buildIndexFindings } from './queryAnalysisIndexRules';

export function buildAnalysisFindings(
    normalizedSql: string,
    rawPlan: QueryAnalysisPlanNode,
    indexes: QueryAnalysisIndexMetadata[]
): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];
    const planNodes = flattenPlan(rawPlan);
    const predicates = extractQueryPredicates(normalizedSql);
    const joins = extractQueryJoins(normalizedSql);

    if (/\bselect\s+\*/i.test(normalizedSql)) {
        findings.push({
            severity: 'medium',
            category: 'query_shape',
            title: 'Wide projection via SELECT *',
            evidence: ['The query selects every column, which can increase I/O and row width unnecessarily.'],
            suggestion: 'Project only the columns needed by the result set to reduce row width and memory pressure.',
            confidence: 'high',
            isHeuristic: false
        });
    }

    for (const node of planNodes) {
        appendNodeFindings(findings, node, indexes);
    }

    findings.push(...buildIndexFindings(predicates, joins, indexes));

    return dedupeFindings(findings);
}

function appendNodeFindings(
    findings: QueryAnalysisFinding[],
    node: QueryAnalysisPlanNode,
    indexes: QueryAnalysisIndexMetadata[]
): void {
    if (node.nodeType === 'Seq Scan' && node.relationName) {
        const qualifiedTable = qualifyPlanTable(node);
        const relatedIndexes = indexes.filter((index) => `${index.schemaName}.${index.tableName}` === qualifiedTable);
        const evidence = [`Planner chose a sequential scan on ${qualifiedTable}.`];

        if (typeof node.planRows === 'number') evidence.push(`Estimated rows scanned: ${node.planRows}.`);

        if (node.filter) evidence.push(`Filter: ${node.filter}`);

        findings.push({
            severity: node.planRows && node.planRows > 1000 ? 'high' : 'medium',
            category: 'scan',
            title: `Sequential scan on ${qualifiedTable}`,
            evidence,
            suggestion: relatedIndexes.length > 0
                ? `Check whether the predicate shape can use an existing index on ${qualifiedTable}, or simplify expressions/casts in the filter.`
                : `Consider adding an index that supports the filter or join predicates on ${qualifiedTable}.`,
            confidence: 'medium',
            isHeuristic: true
        });
    }

    if (node.nodeType === 'Sort' && (node.planRows || 0) >= 1000) {
        findings.push({
            severity: 'medium',
            category: 'sort',
            title: 'Large sort operation detected',
            evidence: [`Planner expects to sort approximately ${node.planRows} rows.`, ...(node.sortKey?.length ? [`Sort keys: ${node.sortKey.join(', ')}`] : [])],
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
            suggestion: 'Review join selectivity and supporting indexes on join keys. Large nested loops often indicate missing indexes or filters applied too late.',
            confidence: 'medium',
            isHeuristic: true
        });
    }
}

function flattenPlan(node: QueryAnalysisPlanNode): QueryAnalysisPlanNode[] {
    return [node, ...node.plans.flatMap((entry) => flattenPlan(entry))];
}

function qualifyPlanTable(node: QueryAnalysisPlanNode): string {
    if (node.schema && node.relationName) return `${node.schema}.${node.relationName}`;

    return node.relationName || 'unknown_table';
}

function dedupeFindings(findings: QueryAnalysisFinding[]): QueryAnalysisFinding[] {
    const seen = new Set<string>();

    return findings.filter((finding) => {
        const key = `${finding.category}:${finding.title}`;

        if (seen.has(key)) return false;
        seen.add(key);

        return true;
    });
}
