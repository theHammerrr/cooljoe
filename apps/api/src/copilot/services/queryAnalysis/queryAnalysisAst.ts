import { toAstStatementArray } from '../../safety/sqlAstTypes';
import { parseQueryAst } from '../../safety/queryValidator';
import type { QueryAnalysisJoin, QueryAnalysisPredicate, QueryAnalysisSort } from './types';

interface Scope {
    aliases: Map<string, string>;
    defaultTable?: string;
    entries: object[];
}

export function extractQueryPredicates(sql: string): QueryAnalysisPredicate[] {
    return toAstStatementArray(parseQueryAst(sql)).flatMap((statement) => {
        const scope = createScope(statement);
        const out: QueryAnalysisPredicate[] = [];
        collectPredicates(readValue(statement, 'where'), scope, out);

        return out;
    });
}

export function extractQueryJoins(sql: string): QueryAnalysisJoin[] {
    return toAstStatementArray(parseQueryAst(sql)).flatMap((statement) => {
        const scope = createScope(statement);

        return scope.entries.flatMap((entry) => collectJoin(readValue(entry, 'on'), scope));
    });
}

export function extractQuerySorts(sql: string): QueryAnalysisSort[] {
    return toAstStatementArray(parseQueryAst(sql)).flatMap((statement) => {
        const scope = createScope(statement);

        return readArray(readValue(statement, 'orderby')).flatMap((entry) => collectSort(entry, scope));
    });
}

function createScope(statement: unknown): Scope {
    const entries = readArray(readValue(statement, 'from')).filter(isObject);
    const aliases = new Map<string, string>();
    const tables = new Set<string>();

    for (const entry of entries) {
        const tableName = getTableName(entry);
        const alias = readString(readValue(entry, 'as'));

        if (!tableName) continue;
        tables.add(tableName);
        aliases.set(tableName, tableName);

        if (alias) aliases.set(alias, tableName);
    }

    return { entries, aliases, defaultTable: tables.size === 1 ? Array.from(tables)[0] : undefined };
}

function collectPredicates(node: unknown, scope: Scope, out: QueryAnalysisPredicate[]): void {
    const operator = readString(readValue(node, 'operator'))?.toUpperCase();

    if (!operator) return;

    if (operator === 'AND' || operator === 'OR') {
        collectPredicates(readValue(node, 'left'), scope, out);
        collectPredicates(readValue(node, 'right'), scope, out);

        return;
    }
    const left = extractColumnRef(readValue(node, 'left'), scope, false);
    const rightValue = readString(readValue(readValue(node, 'right'), 'value'));

    if (!left.table && !left.column) return;
    out.push({ table: left.table, column: left.column, operator, usesFunction: left.usesFunction, hasLeadingWildcard: operator === 'LIKE' && !!rightValue?.startsWith('%') });
}

function collectJoin(node: unknown, scope: Scope): QueryAnalysisJoin[] {
    if (readString(readValue(node, 'operator'))?.toUpperCase() !== '=') return [];
    const left = extractColumnRef(readValue(node, 'left'), scope, false);
    const right = extractColumnRef(readValue(node, 'right'), scope, false);

    if (!left.column || !right.column) return [];

    return [{ leftTable: left.table, leftColumn: left.column, rightTable: right.table, rightColumn: right.column }];
}

function collectSort(node: unknown, scope: Scope): QueryAnalysisSort[] {
    const expr = readValue(node, 'expr');
    const sortRef = extractColumnRef(expr, scope, false);

    if (!sortRef.column) return [];

    return [{
        table: sortRef.table,
        column: sortRef.column,
        direction: readString(readValue(node, 'type')) === 'DESC' ? 'DESC' : 'ASC'
    }];
}

function extractColumnRef(node: unknown, scope: Scope, usesFunction: boolean): { table?: string; column?: string; usesFunction: boolean } {
    const type = readString(readValue(node, 'type'));

    if (type === 'function') return extractColumnRef(readArray(readValue(readValue(node, 'args'), 'value'))[0], scope, true);

    if (type !== 'column_ref') return { usesFunction };
    const tableRef = readString(readValue(node, 'table'));

    return { table: tableRef ? scope.aliases.get(tableRef) || tableRef : scope.defaultTable, column: getColumnValue(readValue(node, 'column')), usesFunction };
}

function getTableName(entry: object): string | undefined {
    const table = readString(readValue(entry, 'table'));
    const db = readString(readValue(entry, 'db'));

    return table ? (db ? `${db}.${table}` : table) : undefined;
}

function getColumnValue(node: unknown): string | undefined {
    return readString(node) || readString(readValue(readValue(node, 'expr'), 'value'));
}

function readValue(value: unknown, key: string): unknown {
    return isObject(value) ? Reflect.get(value, key) : undefined;
}

function readArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null;
}
