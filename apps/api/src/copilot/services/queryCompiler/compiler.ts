import { FilterSubtree, SelectSubtree, StructuredSemanticQueryPlan } from './types';
import { buildTableRefPlan, renderFromTable, renderJoinClauses } from './compilerRefs';
import { resolveTableRef } from './compilerDisambiguation';

function q(identifier: string): string {
    if (!identifier) return '';

    if (identifier === '*') return '*';

    return identifier.split('.').map((part) => `"${part.replace(/"/g, '')}"`).join('.');
}

function ensureTablesCoveredByJoinScope(plan: StructuredSemanticQueryPlan, baseTable: string): void {
    const scope = new Set<string>([baseTable]);

    for (const join of plan.joins || []) {
        scope.add(join.fromTable);
        scope.add(join.toTable);
    }
    const referenced = [
        ...plan.select.map((n) => n.table),
        ...(plan.filters || []).map((n) => n.table),
        ...(plan.groupBy || []).map((n) => n.table),
        ...(plan.orderBy || []).map((n) => n.table)
    ];

    for (const table of referenced) if (!scope.has(table)) throw new Error(`Plan references table "${table}" without a FROM/JOIN path.`);
}

function compileSelect(selectNodes: SelectSubtree[], resolve: (table: string, ref?: string, role?: string, alias?: string) => string): string {
    return selectNodes.map((node) => {
        const tableRef = resolve(node.table, node.tableRef, node.role, node.alias);
        const expr = `${q(tableRef)}.${q(node.column)}`;
        const aggExpr = node.agg ? `${node.agg.toUpperCase()}(${expr})` : expr;

        return node.alias ? `${aggExpr} AS ${q(node.alias)}` : aggExpr;
    }).join(', ');
}

function compileFilters(filters: FilterSubtree[] | undefined, resolve: (table: string, ref?: string, role?: string, alias?: string) => string): string {
    if (!filters?.length) return '';
    const conditions = filters.map((node) => {
        const left = `${q(resolve(node.table, node.tableRef, node.role))}.${q(node.column)}`;
        const op = node.op.toUpperCase();

        if (typeof node.value === 'string') return `${left} ${op} '${node.value.replace(/'/g, "''")}'`;

        if (typeof node.value === 'number' || typeof node.value === 'boolean') return `${left} ${op} ${String(node.value)}`;
        const list = node.value.map((value) => typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : String(value)).join(', ');

        return `${left} ${op} (${list})`;
    });

    return ` WHERE ${conditions.join(' AND ')}`;
}

export function compileSemanticPlan(plan: StructuredSemanticQueryPlan): string {
    if (!plan.select.length) throw new Error('Invalid plan: requires at least one select node');
    const baseTable = plan.joins?.[0]?.fromTable || plan.select[0].table;
    ensureTablesCoveredByJoinScope(plan, baseTable);

    const refPlan = buildTableRefPlan(plan, baseTable);
    const resolve = (table: string, tableRef?: string, roleHint?: string, aliasHint?: string) =>
        resolveTableRef(table, refPlan, tableRef, roleHint, aliasHint);
    let sql = `SELECT ${compileSelect(plan.select, resolve)} \nFROM ${renderFromTable(baseTable, refPlan.baseRef, q)}`;
    sql += renderJoinClauses(refPlan, q);
    sql += compileFilters(plan.filters, resolve);

    if (plan.groupBy?.length) sql += ` \nGROUP BY ${plan.groupBy.map((n) => `${q(resolve(n.table, n.tableRef, n.role))}.${q(n.column)}`).join(', ')}`;

    if (plan.orderBy?.length) sql += ` \nORDER BY ${plan.orderBy.map((n) => `${q(resolve(n.table, n.tableRef, n.role))}.${q(n.column)} ${n.dir.toUpperCase()}`).join(', ')}`;

    if (plan.limit !== undefined) sql += ` \nLIMIT ${plan.limit}`;

    return `${sql};`;
}
