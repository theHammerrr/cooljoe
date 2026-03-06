import { JoinEqualityReference } from './draftSchemaAst';

function extractColumnName(columnNode: unknown): string | null {
    if (typeof columnNode === 'string') return columnNode;

    if (typeof columnNode !== 'object' || columnNode === null) return null;
    const expr = Reflect.get(columnNode, 'expr');

    if (typeof expr !== 'object' || expr === null) return null;
    const value = Reflect.get(expr, 'value');

    return typeof value === 'string' ? value : null;
}

function extractColumnRef(node: unknown): { table?: string; column: string } | null {
    if (typeof node !== 'object' || node === null) return null;

    if (Reflect.get(node, 'type') !== 'column_ref') return null;
    const column = extractColumnName(Reflect.get(node, 'column'));

    if (!column) return null;
    const table = Reflect.get(node, 'table');

    return { table: typeof table === 'string' ? table : undefined, column };
}

function collectJoinEqualitiesFromExpr(node: unknown, out: JoinEqualityReference[]): void {
    if (typeof node !== 'object' || node === null) return;

    if (Reflect.get(node, 'type') === 'binary_expr' && Reflect.get(node, 'operator') === '=') {
        const left = extractColumnRef(Reflect.get(node, 'left'));
        const right = extractColumnRef(Reflect.get(node, 'right'));

        if (left && right) out.push({ left, right });
    }

    for (const value of Object.values(node)) collectJoinEqualitiesFromExpr(value, out);
}

export function collectJoinEqualities(fromClause: unknown, out: JoinEqualityReference[]): void {
    if (!Array.isArray(fromClause)) return;

    for (const fromEntry of fromClause) {
        if (typeof fromEntry !== 'object' || fromEntry === null) continue;
        const joinKind = Reflect.get(fromEntry, 'join');

        if (typeof joinKind !== 'string') continue;
        collectJoinEqualitiesFromExpr(Reflect.get(fromEntry, 'on'), out);
    }
}
