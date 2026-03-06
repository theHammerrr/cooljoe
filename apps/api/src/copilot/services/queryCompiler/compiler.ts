import { StructuredSemanticQueryPlan, SelectSubtree, JoinSubtree, FilterSubtree } from './types';

// Helper to reliably double-quote Postgres identifiers (tables/columns)
function q(identifier: string): string {
    if (!identifier) return '';
    if (identifier === '*') return '*';
    const parts = identifier.split('.');
    return parts.map(p => `"${p.replace(/"/g, '')}"`).join('.');
}

function compileSelect(selectNodes: SelectSubtree[]): string {
    const parts = selectNodes.map(node => {
        const fullyQualified = `${q(node.table)}.${q(node.column)}`;
        let expr = fullyQualified;

        if (node.agg) {
            expr = `${node.agg.toUpperCase()}(${fullyQualified})`;
        }

        if (node.alias) {
            expr += ` AS ${q(node.alias)}`;
        }

        return expr;
    });

    return parts.join(', ');
}

function compileJoins(joinNodes?: JoinSubtree[]): string {
    if (!joinNodes || joinNodes.length === 0) return '';
    return ' ' + joinNodes.map(join => {
        const type = join.type.toUpperCase();
        return `${type} JOIN ${q(join.toTable)} ON ${q(join.fromTable)}.${q(join.fromColumn)} = ${q(join.toTable)}.${q(join.toColumn)}`;
    }).join(' ');
}

function compileFilters(filterNodes?: FilterSubtree[]): string {
    if (!filterNodes || filterNodes.length === 0) return '';

    const conditions = filterNodes.map(filter => {
        const left = `${q(filter.table)}.${q(filter.column)}`;
        const op = filter.op.toUpperCase();
        let right = '';

        if (typeof filter.value === 'string') {
            right = `'${filter.value.replace(/'/g, "''")}'`;
        } else if (typeof filter.value === 'number' || typeof filter.value === 'boolean') {
            right = String(filter.value);
        } else if (Array.isArray(filter.value)) {
            const list = filter.value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v)).join(', ');
            right = `(${list})`;
        }

        return `${left} ${op} ${right}`;
    });

    return ` WHERE ${conditions.join(' AND ')}`;
}

function ensureTablesCoveredByJoinScope(plan: StructuredSemanticQueryPlan, baseTable: string): void {
    const scope = new Set<string>([baseTable]);
    if (plan.joins) {
        for (const join of plan.joins) {
            scope.add(join.fromTable);
            scope.add(join.toTable);
        }
    }

    const referenced = new Set<string>();
    for (const selectNode of plan.select) referenced.add(selectNode.table);
    for (const filterNode of plan.filters || []) referenced.add(filterNode.table);
    for (const groupNode of plan.groupBy || []) referenced.add(groupNode.table);
    for (const orderNode of plan.orderBy || []) referenced.add(orderNode.table);

    for (const table of referenced) {
        if (!scope.has(table)) {
            throw new Error(`Plan references table "${table}" without a FROM/JOIN path.`);
        }
    }
}

export function compileSemanticPlan(plan: StructuredSemanticQueryPlan): string {
    if (!plan.select || plan.select.length === 0) {
        throw new Error("Invalid plan: requires at least one select node");
    }

    // Determine the "base" table. Take from the first join "from", otherwise from the first select node.
    const baseTable = plan.joins && plan.joins.length > 0
        ? plan.joins[0].fromTable
        : plan.select[0].table;
    ensureTablesCoveredByJoinScope(plan, baseTable);

    let sql = `SELECT ${compileSelect(plan.select)} \nFROM ${q(baseTable)}`;

    sql += compileJoins(plan.joins);
    sql += compileFilters(plan.filters);

    if (plan.groupBy && plan.groupBy.length > 0) {
        sql += ` \nGROUP BY ` + plan.groupBy.map(gb => `${q(gb.table)}.${q(gb.column)}`).join(', ');
    }

    if (plan.orderBy && plan.orderBy.length > 0) {
        sql += ` \nORDER BY ` + plan.orderBy.map(ob => `${q(ob.table)}.${q(ob.column)} ${ob.dir.toUpperCase()}`).join(', ');
    }

    if (plan.limit !== undefined) {
        sql += ` \nLIMIT ${plan.limit}`;
    }

    return sql + ';';
}
