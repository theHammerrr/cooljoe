import { DraftDiagnostic } from './diagnostics';
import { StructuredSemanticQueryPlan } from '../../services/queryCompiler/types';

export function collectReferencedTables(plan: StructuredSemanticQueryPlan): string[] {
    const tables = new Set<string>();

    for (const node of plan.select) tables.add(node.table);

    for (const node of plan.groupBy || []) tables.add(node.table);

    for (const node of plan.orderBy || []) tables.add(node.table);

    for (const node of plan.filters || []) tables.add(node.table);

    for (const join of plan.joins || []) {
        tables.add(join.fromTable);
        tables.add(join.toTable);
    }

    return Array.from(tables);
}

export function hasTimeGrouping(plan: StructuredSemanticQueryPlan): boolean {
    return (plan.groupBy || []).some((node) => isTimeColumn(node.column));
}

export function hasTimeFilter(plan: StructuredSemanticQueryPlan): boolean {
    return (plan.filters || []).some((node) => isTimeColumn(node.column));
}

export function validateColumnScope(
    plan: StructuredSemanticQueryPlan,
    candidateColumnsByTable: Record<string, string[]>
): DraftDiagnostic[] {
    const diagnostics: DraftDiagnostic[] = [];
    const nodes = [
        ...plan.select,
        ...(plan.groupBy || []),
        ...(plan.orderBy || []),
        ...(plan.filters || [])
    ];

    for (const node of nodes) {
        const allowedColumns = candidateColumnsByTable[node.table];

        if (!allowedColumns || allowedColumns.length === 0) continue;

        if (node.column === '*' || allowedColumns.includes(node.column)) continue;

        diagnostics.push({
            code: 'PLAN_OUTSIDE_COLUMN_SCOPE',
            message: `Plan referenced column "${node.table}.${node.column}" outside the narrowed candidate column scope.`,
            table: node.table,
            column: node.column
        });
    }

    return diagnostics;
}

export function validateJoinScope(
    plan: StructuredSemanticQueryPlan,
    allowedJoinGraph: Array<{ fromTable: string; fromColumn: string; toTable: string; toColumn: string }>
): DraftDiagnostic[] {
    if (allowedJoinGraph.length === 0 || !plan.joins?.length) return [];

    const allowedEdges = new Set(allowedJoinGraph.map((edge) => `${edge.fromTable}:${edge.fromColumn}:${edge.toTable}:${edge.toColumn}`));
    const diagnostics: DraftDiagnostic[] = [];

    for (const join of plan.joins) {
        const edgeKey = `${join.fromTable}:${join.fromColumn}:${join.toTable}:${join.toColumn}`;
        const reverseEdgeKey = `${join.toTable}:${join.toColumn}:${join.fromTable}:${join.fromColumn}`;

        if (allowedEdges.has(edgeKey) || allowedEdges.has(reverseEdgeKey)) continue;

        diagnostics.push({
            code: 'PLAN_INVALID_JOIN_PATH',
            message: `Plan used a join path outside the narrowed join graph: ${join.fromTable}.${join.fromColumn} -> ${join.toTable}.${join.toColumn}`
        });
    }

    return diagnostics;
}

function isTimeColumn(column: string): boolean {
    return /\b(date|time|created_at|updated_at|timestamp)\b/i.test(column);
}
