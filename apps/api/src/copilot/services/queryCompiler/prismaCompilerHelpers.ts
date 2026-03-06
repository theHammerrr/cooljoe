import { FilterSubtree, JoinSubtree, SelectSubtree } from './types';

export function hasAgg(select: SelectSubtree): boolean {
    return !!select.agg;
}

export function stripSchemaName(value: string): string {
    const parts = value.split('.');
    return parts[parts.length - 1] || value;
}

export function mapOperator(op: string, value: unknown): Record<string, unknown> {
    switch (op) {
        case '=': return { equals: value };
        case '!=': return { not: value };
        case '>': return { gt: value };
        case '<': return { lt: value };
        case '>=': return { gte: value };
        case '<=': return { lte: value };
        case 'LIKE':
        case 'ILIKE':
            return { contains: String(value).replace(/%/g, ''), mode: 'insensitive' };
        case 'IN':
            return { in: Array.isArray(value) ? value : [value] };
        default:
            return { equals: value };
    }
}

function buildIncludes(currentTable: string, joins: JoinSubtree[], selects: SelectSubtree[]): Record<string, unknown> | true {
    const tableSelects = selects.filter((s) => s.table === currentTable);
    const relatedJoins = joins.filter((j) => j.fromTable === currentTable);

    if (tableSelects.length === 0 && relatedJoins.length === 0) return true;

    const selectBlock: Record<string, boolean> = {};
    for (const s of tableSelects) if (s.column !== '*') selectBlock[s.column] = true;

    const includeBlock: Record<string, unknown> = {};
    for (const join of relatedJoins) includeBlock[join.toTable] = buildIncludes(join.toTable, joins, selects);

    const result: Record<string, unknown> = {};
    if (Object.keys(selectBlock).length > 0) result.select = selectBlock;
    if (Object.keys(includeBlock).length > 0) result.include = includeBlock;
    return Object.keys(result).length > 0 ? result : true;
}

export function buildSelectIncludeTree(modelName: string, joins: JoinSubtree[], select: SelectSubtree[]): Record<string, unknown> | true {
    const unqualifiedJoins = joins.map((j) => ({
        ...j,
        fromTable: stripSchemaName(j.fromTable),
        toTable: stripSchemaName(j.toTable)
    }));
    const unqualifiedSelect = select.map((s) => ({ ...s, table: stripSchemaName(s.table) }));
    return buildIncludes(modelName, unqualifiedJoins, unqualifiedSelect);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function mergeFilter(existing: unknown, filter: FilterSubtree): Record<string, unknown> {
    const next = mapOperator(filter.op, filter.value);
    if (!isRecord(existing)) return next;
    return { ...existing, ...next };
}

export function formatPrismaArgs(args: Record<string, unknown>): string {
    const argsString = Object.keys(args).length > 0 ? JSON.stringify(args, null, 2) : '';
    return argsString
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/: "true"/g, ': true')
        .replace(/: "false"/g, ': false');
}
