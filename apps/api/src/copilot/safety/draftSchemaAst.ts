import { Parser } from 'node-sql-parser';
import { normalizeIdentifier } from './draftSchemaTopology';
import { AstStatement } from './sqlAstTypes';

const parser = new Parser();

export interface ColumnReference {
    column: string;
    table?: string;
}

export interface JoinEqualityReference {
    left: { table?: string; column: string };
    right: { table?: string; column: string };
}

function extractColumnName(columnNode: unknown): string | null {
    if (typeof columnNode === 'string') {
        return columnNode;
    }

    if (typeof columnNode !== 'object' || columnNode === null) {
        return null;
    }
    const expr = Reflect.get(columnNode, 'expr');

    if (typeof expr !== 'object' || expr === null) {
        return null;
    }
    const value = Reflect.get(expr, 'value');

    return typeof value === 'string' ? value : null;
}

export function parseSqlAst(sql: string): { ast?: AstStatement | AstStatement[]; error?: string } {
    try {
        return { ast: parser.astify(sql, { database: 'Postgresql' }) };
    } catch (error: unknown) {
        const parseMessage = error instanceof Error ? error.message : 'Unknown parser error';

        return { error: `Invalid SQL syntax: ${parseMessage}` };
    }
}

export function addTablesFromFromClause(fromClause: unknown, queryTables: Set<string>, aliasToTable: Map<string, string>): void {
    if (!Array.isArray(fromClause)) {
        return;
    }

    for (const tableRef of fromClause) {
        if (typeof tableRef !== 'object' || tableRef === null) {
            continue;
        }
        const tableCandidate = Reflect.get(tableRef, 'table');
        const dbCandidate = Reflect.get(tableRef, 'db');
        let fullTableName = '';

        if (typeof tableCandidate === 'string') {
            const normalizedTable = normalizeIdentifier(tableCandidate);
            fullTableName = typeof dbCandidate === 'string' && dbCandidate
                ? `${normalizeIdentifier(dbCandidate)}.${normalizedTable}`
                : normalizedTable;
            queryTables.add(fullTableName);
            aliasToTable.set(normalizedTable, fullTableName);
        }
        const aliasCandidate = Reflect.get(tableRef, 'as');

        if (typeof aliasCandidate === 'string' && fullTableName) {
            aliasToTable.set(normalizeIdentifier(aliasCandidate), fullTableName);
        }
    }
}

export function collectColumnReferences(node: unknown, out: ColumnReference[]): void {
    if (Array.isArray(node)) {
        for (const item of node) collectColumnReferences(item, out);

        return;
    }

    if (typeof node !== 'object' || node === null) {
        return;
    }

    if (Reflect.get(node, 'type') === 'column_ref') {
        const column = extractColumnName(Reflect.get(node, 'column'));
        const table = Reflect.get(node, 'table');

        if (column) {
            out.push({ column, table: typeof table === 'string' ? table : undefined });
        }
    }

    for (const value of Object.values(node)) collectColumnReferences(value, out);
}
