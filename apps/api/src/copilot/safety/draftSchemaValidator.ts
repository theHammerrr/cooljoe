import { addTablesFromFromClause, collectColumnReferences, parseSqlAst } from './draftSchemaAst';
import {
    buildSchemaColumnsByTable,
    normalizeIdentifier,
    parseTopology,
    tableExistsInParsedTopology
} from './draftSchemaTopology';

export function tableExistsInSchema(schema: unknown, tableName: string): boolean {
    const topology = parseTopology(schema);
    return topology ? tableExistsInParsedTopology(topology, tableName) : false;
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

    const schemaColumnsByTable = buildSchemaColumnsByTable(topology);
    const astResult = parseSqlAst(sql);
    if (astResult.error) {
        return { valid: false, errors: [astResult.error] };
    }

    const ast = astResult.ast;
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

        const columnRefs: { column: string; table?: string }[] = [];
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
