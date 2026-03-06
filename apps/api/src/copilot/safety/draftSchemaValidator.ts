import { addTablesFromFromClause, collectColumnReferences, parseSqlAst } from './draftSchemaAst';
import { collectJoinEqualities } from './draftJoinAst';
import { validateJoinRelationships } from './draftJoinValidation';
import {
    buildSchemaColumnsByTable,
    getForeignKeyTargets,
    getPrimaryKeyByTable,
    normalizeIdentifier,
    parseTopology,
    tableExistsInParsedTopology
} from './draftSchemaTopology';
import { isAstSelectStatement, toAstStatementArray } from './sqlAstTypes';

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

    if (!topology) return { valid: false, errors: ['Schema snapshot is missing or invalid. Click "Sync DB" and retry.'] };

    const schemaColumnsByTable = buildSchemaColumnsByTable(topology);
    const foreignKeyTargets = getForeignKeyTargets(topology);
    const primaryKeyByTable = getPrimaryKeyByTable(topology);
    const astResult = parseSqlAst(sql);

    if (astResult.error) {
        return { valid: false, errors: [astResult.error] };
    }

    const astArray = toAstStatementArray(astResult.ast);
    const errors = new Set<string>();

    for (const statement of astArray) {
        if (!isAstSelectStatement(statement)) continue;

        const queryTables = new Set<string>();
        const aliasToTable = new Map<string, string>();
        addTablesFromFromClause(statement.from, queryTables, aliasToTable);
        const normalizedRequiredSchema = requiredSchema ? normalizeIdentifier(requiredSchema) : '';

        for (const table of queryTables) {
            if (!schemaColumnsByTable.has(table)) errors.add(`Unknown table in draft SQL: ${table}`);

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
        const joinEqualities: { left: { table?: string; column: string }; right: { table?: string; column: string } }[] = [];
        collectJoinEqualities(statement.from, joinEqualities);

        for (const joinError of validateJoinRelationships(joinEqualities, aliasToTable, foreignKeyTargets, primaryKeyByTable)) errors.add(joinError);

        for (const columnRef of columnRefs) {
            const normalizedColumn = normalizeIdentifier(columnRef.column);

            if (normalizedColumn === '*') continue;

            const tableRef = columnRef.table ? normalizeIdentifier(columnRef.table) : '';

            if (tableRef) {
                const resolvedTable = aliasToTable.get(tableRef) || tableRef;
                const inQueryScope = queryTables.has(resolvedTable) || Array.from(queryTables).some((table) => {
                    const tableParts = table.split('.');
                    const resolvedParts = resolvedTable.split('.');
                    const tableBare = tableParts[tableParts.length - 1];
                    const resolvedBare = resolvedParts[resolvedParts.length - 1];

                    return tableBare === resolvedBare;
                });

                if (!inQueryScope) {
                    errors.add(`Table "${resolvedTable}" is referenced by column "${columnRef.column}" but is not present in FROM/JOIN.`);
                    continue;
                }
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
