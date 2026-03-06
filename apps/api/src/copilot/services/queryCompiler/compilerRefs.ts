import { StructuredSemanticQueryPlan } from './types';

interface PlannedJoin {
    type: string;
    fromRef: string;
    toRef: string;
    toTable: string;
    fromColumn: string;
    toColumn: string;
}

export interface TableRefPlan {
    baseRef: string;
    refsByTable: Map<string, string[]>;
    firstRefByTable: Map<string, string>;
    plannedJoins: PlannedJoin[];
}

function countIntroductions(plan: StructuredSemanticQueryPlan, baseTable: string): Map<string, number> {
    const counts = new Map<string, number>();
    const introduced = new Set<string>();
    const bump = (table: string) => counts.set(table, (counts.get(table) || 0) + 1);

    bump(baseTable);
    introduced.add(baseTable);

    for (const join of plan.joins || []) {
        if (!introduced.has(join.fromTable)) {
            bump(join.fromTable);
            introduced.add(join.fromTable);
        }
        bump(join.toTable);
        introduced.add(join.toTable);
    }

    return counts;
}

function aliasForTable(table: string, index: number): string {
    const base = table.split('.').pop() || 't';

    return `${base}_${index}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

function getOrNextRef(table: string, needsAlias: Set<string>, refsByTable: Map<string, string[]>): string {
    const existingRefs = refsByTable.get(table) || [];
    const nextRef = needsAlias.has(table) ? aliasForTable(table, existingRefs.length + 1) : table;
    refsByTable.set(table, existingRefs.concat(nextRef));

    return nextRef;
}

export function buildTableRefPlan(plan: StructuredSemanticQueryPlan, baseTable: string): TableRefPlan {
    const counts = countIntroductions(plan, baseTable);
    const needsAlias = new Set<string>();

    for (const [table, count] of counts.entries()) if (count > 1) needsAlias.add(table);

    const refsByTable = new Map<string, string[]>();
    const firstRefByTable = new Map<string, string>();
    const latestRefByTable = new Map<string, string>();
    const baseRef = getOrNextRef(baseTable, needsAlias, refsByTable);
    firstRefByTable.set(baseTable, baseRef);
    latestRefByTable.set(baseTable, baseRef);

    const plannedJoins: PlannedJoin[] = [];

    for (const join of plan.joins || []) {
        const fromRef = latestRefByTable.get(join.fromTable) || firstRefByTable.get(join.fromTable) || join.fromTable;
        const toRef = getOrNextRef(join.toTable, needsAlias, refsByTable);

        if (!firstRefByTable.has(join.toTable)) firstRefByTable.set(join.toTable, toRef);
        latestRefByTable.set(join.toTable, toRef);
        plannedJoins.push({
            type: join.type.toUpperCase(),
            fromRef,
            toRef,
            toTable: join.toTable,
            fromColumn: join.fromColumn,
            toColumn: join.toColumn
        });
    }

    return { baseRef, refsByTable, firstRefByTable, plannedJoins };
}

export function renderFromTable(baseTable: string, baseRef: string, quote: (value: string) => string): string {
    if (baseRef === baseTable) return quote(baseTable);

    return `${quote(baseTable)} AS ${quote(baseRef)}`;
}

export function renderJoinClauses(plan: TableRefPlan, quote: (value: string) => string): string {
    if (plan.plannedJoins.length === 0) return '';
    const segments = plan.plannedJoins.map((join) => {
        const toTarget = join.toRef === join.toTable ? quote(join.toTable) : `${quote(join.toTable)} AS ${quote(join.toRef)}`;

        return `${join.type} JOIN ${toTarget} ON ${quote(join.fromRef)}.${quote(join.fromColumn)} = ${quote(join.toRef)}.${quote(join.toColumn)}`;
    });

    return ` ${segments.join(' ')}`;
}
