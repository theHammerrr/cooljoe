import type {
    QueryAnalysisFinding,
    QueryAnalysisIndexMetadata,
    QueryAnalysisMode,
    QueryAnalysisPlanNode,
    QueryAnalysisTableStats
} from './types';
import { extractQueryJoins, extractQueryPredicates, extractQuerySorts } from './queryAnalysisAst';
import { buildIndexFindings } from './queryAnalysisIndexRules';
import { buildSortFindings } from './queryAnalysisSortRules';
import { appendPlanNodeFindings, flattenPlan } from './queryAnalysisPlanFindings';
import { buildRuntimeFindings } from './queryAnalysisRuntimeAnalysis';

export function buildAnalysisFindings(
    normalizedSql: string,
    rawPlan: QueryAnalysisPlanNode,
    indexes: QueryAnalysisIndexMetadata[],
    tableStats: QueryAnalysisTableStats[],
    mode: QueryAnalysisMode
): QueryAnalysisFinding[] {
    const findings: QueryAnalysisFinding[] = [];
    const planNodes = flattenPlan(rawPlan);
    const predicates = extractQueryPredicates(normalizedSql);
    const joins = extractQueryJoins(normalizedSql);
    const sorts = extractQuerySorts(normalizedSql);

    if (/\bselect\s+\*/i.test(normalizedSql)) {
        findings.push({
            severity: 'medium',
            category: 'query_shape',
            title: 'Wide projection via SELECT *',
            evidence: ['The query selects every column, which can increase I/O and row width unnecessarily.'],
            evidenceSources: ['sql_shape'],
            suggestion: 'Project only the columns needed by the result set to reduce row width and memory pressure.',
            confidence: 'high',
            isHeuristic: false
        });
    }

    for (const node of planNodes) {
        appendPlanNodeFindings(findings, node, indexes, tableStats);
    }

    findings.push(...buildIndexFindings(predicates, joins, indexes, tableStats));
    findings.push(...buildSortFindings(sorts, predicates, indexes, tableStats));
    findings.push(...buildRuntimeFindings(planNodes, mode));

    return dedupeFindings(findings);
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
