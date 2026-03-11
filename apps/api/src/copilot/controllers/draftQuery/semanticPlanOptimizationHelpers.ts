import { IntentSketch } from './intentSketch';
import { JoinGraphEdge, TableCatalogRow } from './models';
import { StructuredSemanticQueryPlan } from '../../services/queryCompiler/types';

export interface CandidateColumnInfo {
    columnsByTable: Record<string, string[]>;
}

export function dedupeNodes<T>(nodes: T[]): T[] {
    const seen = new Set<string>();

    return nodes.filter((node) => {
        const key = JSON.stringify(node);

        if (seen.has(key)) return false;

        seen.add(key);

        return true;
    });
}

export function dedupeStrings(values: string[]): string[] {
    return Array.from(new Set(values));
}

export function collectReferencedTables(plan: Pick<StructuredSemanticQueryPlan, 'select' | 'filters' | 'groupBy' | 'orderBy'>): Set<string> {
    const referencedTables = new Set<string>();

    for (const node of plan.select) referencedTables.add(node.table);

    for (const node of plan.filters || []) referencedTables.add(node.table);

    for (const node of plan.groupBy || []) referencedTables.add(node.table);

    for (const node of plan.orderBy || []) referencedTables.add(node.table);

    return referencedTables;
}

export function pruneUnusedJoins(joins: StructuredSemanticQueryPlan['joins'] = [], referencedTables: Set<string>, joinGraph: JoinGraphEdge[]): NonNullable<StructuredSemanticQueryPlan['joins']> {
    if (joins.length === 0) return [];

    const allowedEdges = new Set(joinGraph.map((edge) => `${edge.fromTable}:${edge.fromColumn}:${edge.toTable}:${edge.toColumn}`));

    return joins.filter((join) => {
        const edgeKey = `${join.fromTable}:${join.fromColumn}:${join.toTable}:${join.toColumn}`;
        const reverseEdgeKey = `${join.toTable}:${join.toColumn}:${join.fromTable}:${join.fromColumn}`;
        const touchesReferencedTable = referencedTables.has(join.fromTable) || referencedTables.has(join.toTable);

        return touchesReferencedTable && (allowedEdges.size === 0 || allowedEdges.has(edgeKey) || allowedEdges.has(reverseEdgeKey));
    });
}

export function normalizeLimit(limit: number | undefined, intentSketch?: IntentSketch): number {
    if (intentSketch?.asksForTopN && intentSketch.rankingLimit) {
        return Math.min(limit ?? intentSketch.rankingLimit, intentSketch.rankingLimit);
    }

    if (!limit || limit <= 0) return 100;

    return Math.min(limit, 100);
}

export function expandStarSelects(
    select: StructuredSemanticQueryPlan['select'],
    candidateColumnInfo?: CandidateColumnInfo
): StructuredSemanticQueryPlan['select'] {
    if (!candidateColumnInfo) return select;

    const expanded: StructuredSemanticQueryPlan['select'] = [];

    for (const node of select) {
        if (node.column !== '*') {
            expanded.push(node);
            continue;
        }

        const candidateColumns = candidateColumnInfo.columnsByTable[node.table] || [];

        if (candidateColumns.length === 0) {
            expanded.push(node);
            continue;
        }

        for (const column of candidateColumns) {
            expanded.push({
                ...node,
                column,
                alias: undefined
            });
        }
    }

    return dedupeNodes(expanded);
}

export function buildCandidateColumnInfo(tableCatalog: TableCatalogRow[]): CandidateColumnInfo {
    return {
        columnsByTable: Object.fromEntries(tableCatalog.map((row) => [row.table, row.columns.slice(0, 8)]))
    };
}
