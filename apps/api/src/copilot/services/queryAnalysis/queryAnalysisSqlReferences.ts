import type { QueryAnalysisPlanNode } from './types';

export interface QuerySqlFragments {
    selectClause?: string;
    fromClause?: string;
    whereClause?: string;
    groupByClause?: string;
    orderByClause?: string;
    limitClause?: string;
    withClause?: string;
    distinctClause?: string;
    windowClauses: string[];
    joinClauses: string[];
    setOperationClauses: string[];
}

export function attachSqlReferencesToPlan(root: QueryAnalysisPlanNode, normalizedSql: string): QueryAnalysisPlanNode {
    const fragments = extractQuerySqlFragments(normalizedSql);

    return attachNodeReferences(root, fragments);
}

function attachNodeReferences(node: QueryAnalysisPlanNode, fragments: QuerySqlFragments): QueryAnalysisPlanNode {
    return {
        ...node,
        sqlReferences: getSqlReferencesForNode(node, fragments),
        plans: node.plans.map((child) => attachNodeReferences(child, fragments))
    };
}

function getSqlReferencesForNode(node: QueryAnalysisPlanNode, fragments: QuerySqlFragments): string[] {
    switch (node.nodeType) {
        case 'Seq Scan':
        case 'Index Scan':
        case 'Index Only Scan':
        case 'Bitmap Heap Scan':
        case 'Bitmap Index Scan':
            return compactReferences([fragments.fromClause, fragments.whereClause]);
        case 'Nested Loop':
        case 'Hash Join':
        case 'Merge Join':
            return compactReferences([...fragments.joinClauses, fragments.whereClause]);
        case 'Sort':
        case 'Incremental Sort':
            return compactReferences([fragments.orderByClause]);
        case 'Aggregate':
        case 'GroupAggregate':
        case 'HashAggregate':
            return compactReferences([fragments.selectClause, fragments.groupByClause]);
        case 'WindowAgg':
            return compactReferences(fragments.windowClauses.length > 0 ? fragments.windowClauses : [fragments.selectClause]);
        case 'Limit':
            return compactReferences([fragments.limitClause]);
        case 'Unique':
            return compactReferences([fragments.distinctClause, ...fragments.setOperationClauses, fragments.selectClause]);
        case 'Append':
        case 'Merge Append':
        case 'SetOp':
            return compactReferences(fragments.setOperationClauses);
        case 'CTE Scan':
            return compactReferences([fragments.withClause]);
        case 'Subquery Scan':
            return compactReferences([fragments.fromClause]);
        case 'Result':
            return compactReferences([fragments.selectClause]);
        default:
            return compactReferences([fragments.fromClause, fragments.whereClause, fragments.orderByClause, fragments.limitClause]);
    }
}

export function extractQuerySqlFragments(sql: string): QuerySqlFragments {
    return {
        selectClause: matchClause(sql, /\bselect\b[\s\S]*?(?=\bfrom\b)/i),
        fromClause: matchClause(sql, /\bfrom\b[\s\S]*?(?=\bwhere\b|\bgroup\s+by\b|\border\s+by\b|\blimit\b|$)/i),
        whereClause: matchClause(sql, /\bwhere\b[\s\S]*?(?=\bgroup\s+by\b|\border\s+by\b|\blimit\b|$)/i),
        groupByClause: matchClause(sql, /\bgroup\s+by\b[\s\S]*?(?=\border\s+by\b|\blimit\b|$)/i),
        orderByClause: matchClause(sql, /\border\s+by\b[\s\S]*?(?=\blimit\b|$)/i),
        limitClause: matchClause(sql, /\blimit\b[\s\S]*$/i),
        withClause: matchClause(sql, /\bwith\b[\s\S]*?(?=\bselect\b)/i),
        distinctClause: matchClause(sql, /\bselect\s+distinct(?:\s+on\s*\([\s\S]*?\))?/i),
        windowClauses: extractMatches(sql, /\bover\s*\([\s\S]*?\)/gi),
        joinClauses: extractMatches(sql, /\b(?:inner|left|right|full|cross)?\s*join\b[\s\S]*?\bon\b[\s\S]*?(?=\b(?:inner|left|right|full|cross)?\s*join\b|\bwhere\b|\bgroup\s+by\b|\border\s+by\b|\blimit\b|$)/gi),
        setOperationClauses: extractMatches(sql, /\b(?:union(?:\s+all)?|intersect|except)\b[\s\S]*?(?=\b(?:union(?:\s+all)?|intersect|except)\b|$)/gi)
    };
}

function matchClause(sql: string, pattern: RegExp): string | undefined {
    const match = sql.match(pattern);

    return match ? collapseWhitespace(match[0]) : undefined;
}

function extractMatches(sql: string, pattern: RegExp): string[] {
    return Array.from(sql.matchAll(pattern), (match) => collapseWhitespace(match[0])).filter(Boolean);
}

function compactReferences(values: Array<string | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

function collapseWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}
