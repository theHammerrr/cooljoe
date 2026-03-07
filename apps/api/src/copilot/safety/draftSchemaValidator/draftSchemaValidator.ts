import { DraftDiagnostic, DraftValidationResult } from '../../controllers/draftQuery/diagnostics';
import { addTablesFromFromClause, parseSqlAst } from '../draftSchemaAst';
import {
    buildSchemaColumnsByTable,
    getForeignKeyTargets,
    getPrimaryKeyByTable,
    normalizeIdentifier,
    parseTopology,
    tableExistsInParsedTopology
} from '../draftSchemaTopology';
import { AstSelectStatement, isAstSelectStatement, toAstStatementArray } from '../sqlAstTypes';
import { buildValidationResult } from './draftSchemaValidatorDiagnostics';
import { validateQueryColumns } from './draftSchemaValidatorColumns';
import { validateQueryJoins } from './draftSchemaValidatorJoins';
import { validateQueryTables } from './draftSchemaValidatorTables';

export function tableExistsInSchema(schema: unknown, tableName: string): boolean {
    const topology = parseTopology(schema);

    return topology ? tableExistsInParsedTopology(topology, tableName) : false;
}

export function validateDraftSqlAgainstSchema(sql: string, schema: unknown): DraftValidationResult {
    return validateDraftSqlAgainstSchemaWithRequirements(sql, schema);
}

export function validateDraftSqlAgainstSchemaWithRequirements(
    sql: string,
    schema: unknown,
    requiredSchema?: string
): DraftValidationResult {
    const topology = parseTopology(schema);

    if (!topology) {
        return buildValidationResult([{
            code: 'INVALID_SCHEMA_SNAPSHOT',
            message: 'Schema snapshot is missing or invalid. Click "Sync DB" and retry.'
        }]);
    }

    const schemaColumnsByTable = buildSchemaColumnsByTable(topology);
    const foreignKeyTargets = getForeignKeyTargets(topology);
    const primaryKeyByTable = getPrimaryKeyByTable(topology);
    const astResult = parseSqlAst(sql);

    if (astResult.error) {
        return buildValidationResult([{
            code: 'INVALID_SQL_SYNTAX',
            message: astResult.error
        }]);
    }

    const astArray = toAstStatementArray(astResult.ast);

    if (astArray.length === 0) {
        return buildValidationResult([{
            code: 'UNSUPPORTED_SQL_STATEMENT',
            message: 'Draft SQL must contain exactly one read-only SELECT statement.'
        }]);
    }

    if (astArray.length > 1) {
        return buildValidationResult([{
            code: 'MULTI_STATEMENT_NOT_ALLOWED',
            message: 'Draft SQL must contain exactly one statement.'
        }]);
    }

    if (!isAstSelectStatement(astArray[0])) {
        return buildValidationResult([{
            code: 'NON_SELECT_QUERY',
            message: 'Draft SQL must be a read-only SELECT statement.'
        }]);
    }

    return validateSelectStatement(astArray[0], schemaColumnsByTable, foreignKeyTargets, primaryKeyByTable, requiredSchema);
}

function validateSelectStatement(
    statement: AstSelectStatement,
    schemaColumnsByTable: ReturnType<typeof buildSchemaColumnsByTable>,
    foreignKeyTargets: ReturnType<typeof getForeignKeyTargets>,
    primaryKeyByTable: ReturnType<typeof getPrimaryKeyByTable>,
    requiredSchema?: string
): DraftValidationResult {
    const diagnostics: DraftDiagnostic[] = [];
    const queryTables = new Set<string>();
    const aliasToTable = new Map<string, string>();
    const normalizedRequiredSchema = requiredSchema ? normalizeIdentifier(requiredSchema) : '';
    addTablesFromFromClause(statement.from, queryTables, aliasToTable);
    validateQueryTables(queryTables, schemaColumnsByTable, normalizedRequiredSchema, diagnostics);
    validateQueryJoins(statement, aliasToTable, foreignKeyTargets, primaryKeyByTable, diagnostics);
    validateQueryColumns(statement, queryTables, aliasToTable, schemaColumnsByTable, diagnostics);

    return buildValidationResult(diagnostics);
}
