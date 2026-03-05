/* eslint-disable max-lines */
import { Parser } from 'node-sql-parser';
import { z } from 'zod';

const parser = new Parser();

const topologySchema = z.record(
    z.string(),
    z.array(
        z.object({
            column: z.string()
        })
    )
);

type ParsedTopology = z.infer<typeof topologySchema>;

function normalizeIdentifier(value: string): string {
    return value.replace(/^"+|"+$/g, '').toLowerCase();
}

function parseTopology(schema: unknown): ParsedTopology | null {
    const parsed = topologySchema.safeParse(schema);
    if (!parsed.success) {
        return null;
    }
    return parsed.data;
}

function addTablesFromFromClause(
    fromClause: unknown,
    queryTables: Set<string>,
    aliasToTable: Map<string, string>
): void {
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
            if (typeof dbCandidate === 'string' && dbCandidate) {
                fullTableName = `${normalizeIdentifier(dbCandidate)}.${normalizedTable}`;
            } else {
                fullTableName = normalizedTable;
            }
            queryTables.add(fullTableName);
            aliasToTable.set(normalizedTable, fullTableName);
        }

        const aliasCandidate = Reflect.get(tableRef, 'as');
        if (typeof aliasCandidate === 'string' && fullTableName) {
            aliasToTable.set(normalizeIdentifier(aliasCandidate), fullTableName);
        }
    }
}

interface ColumnReference {
    column: string;
    table?: string;
}

function collectColumnReferences(node: unknown, out: ColumnReference[]): void {
    if (Array.isArray(node)) {
        for (const item of node) {
            collectColumnReferences(item, out);
        }
        return;
    }

    if (typeof node !== 'object' || node === null) {
        return;
    }

    const nodeType = Reflect.get(node, 'type');
    if (nodeType === 'column_ref') {
        const column = Reflect.get(node, 'column');
        const table = Reflect.get(node, 'table');
        if (typeof column === 'string') {
            out.push({
                column,
                table: typeof table === 'string' ? table : undefined
            });
        }
    }

    for (const value of Object.values(node)) {
        collectColumnReferences(value, out);
    }
}

export function tableExistsInSchema(schema: unknown, tableName: string): boolean {
    const topology = parseTopology(schema);
    if (!topology) {
        return false;
    }
    const normalized = normalizeIdentifier(tableName);
    // tableName could be 'users' or 'auth.users'
    return Object.keys(topology).some((topologyKey) => {
        const parts = topologyKey.split('.');
        const tName = parts.length > 1 ? parts[1] : parts[0];
        return normalizeIdentifier(topologyKey) === normalized || normalizeIdentifier(tName) === normalized;
    });
}

export function validateDraftSqlAgainstSchema(sql: string, schema: unknown): { valid: boolean; errors: string[] } {
    return validateDraftSqlAgainstSchemaWithRequirements(sql, schema);
}

export function validateDraftSqlAgainstSchemaWithRequirements(
    sql: string,
    schema: unknown,
    requiredSchema?: string
): { valid: boolean; errors: string[] } {
    const topology = parseTopology(schema);
    if (!topology) {
        return { valid: false, errors: ['Schema snapshot is missing or invalid. Click "Sync DB" and retry.'] };
    }

    const schemaColumnsByTable = new Map<string, Set<string>>();
    for (const [topologyKey, columns] of Object.entries(topology)) {
        const normalizedKey = normalizeIdentifier(topologyKey);
        const parts = normalizedKey.split('.');
        const tableName = parts.length > 1 ? parts[1] : parts[0];
        const colSet = new Set(columns.map((column) => normalizeIdentifier(column.column)));

        schemaColumnsByTable.set(normalizedKey, colSet);
        if (!schemaColumnsByTable.has(tableName)) {
            schemaColumnsByTable.set(tableName, colSet);
        }
    }

    let ast: unknown;
    try {
        ast = parser.astify(sql, { database: 'Postgresql' });
    } catch (error: unknown) {
        const parseMessage = error instanceof Error ? error.message : 'Unknown parser error';
        return { valid: false, errors: [`Invalid SQL syntax: ${parseMessage}`] };
    }

    const astArray = Array.isArray(ast) ? ast : [ast];
    const errors = new Set<string>();

    for (const statement of astArray) {
        if (typeof statement !== 'object' || statement === null) {
            continue;
        }

        const statementType = Reflect.get(statement, 'type');
        if (statementType !== 'select') {
            continue;
        }

        const queryTables = new Set<string>();
        const aliasToTable = new Map<string, string>();
        addTablesFromFromClause(Reflect.get(statement, 'from'), queryTables, aliasToTable);
        const normalizedRequiredSchema = requiredSchema ? normalizeIdentifier(requiredSchema) : '';

        for (const table of queryTables) {
            if (!schemaColumnsByTable.has(table)) {
                errors.add(`Unknown table in draft SQL: ${table}`);
            }

            if (normalizedRequiredSchema) {
                const parts = table.split('.');
                if (parts.length < 2) {
                    errors.add(`Table "${table}" must be schema-qualified with "${normalizedRequiredSchema}".`);
                } else if (normalizeIdentifier(parts[0]) !== normalizedRequiredSchema) {
                    errors.add(`Table "${table}" is not in required schema "${normalizedRequiredSchema}".`);
                }
            }
        }

        const columnRefs: ColumnReference[] = [];
        collectColumnReferences(statement, columnRefs);

        for (const columnRef of columnRefs) {
            const normalizedColumn = normalizeIdentifier(columnRef.column);
            if (normalizedColumn === '*') {
                continue;
            }

            const tableRef = columnRef.table ? normalizeIdentifier(columnRef.table) : '';
            if (tableRef) {
                const resolvedTable = aliasToTable.get(tableRef) || tableRef;
                const tableColumns = schemaColumnsByTable.get(resolvedTable);
                if (!tableColumns) {
                    errors.add(`Unknown table referenced by column "${columnRef.column}": ${resolvedTable}`);
                    continue;
                }
                if (!tableColumns.has(normalizedColumn)) {
                    errors.add(`Unknown column "${columnRef.column}" in table "${resolvedTable}"`);
                }
                continue;
            }

            const matchedTables = Array.from(queryTables).filter((table) => {
                const columns = schemaColumnsByTable.get(table);
                return columns ? columns.has(normalizedColumn) : false;
            });

            if (matchedTables.length === 0) {
                errors.add(`Unknown column in draft SQL: ${columnRef.column}`);
            }
        }
    }

    return { valid: errors.size === 0, errors: Array.from(errors) };
}
