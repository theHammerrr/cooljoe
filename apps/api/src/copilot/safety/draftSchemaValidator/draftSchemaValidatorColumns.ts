import { DraftDiagnostic } from '../../controllers/draftQuery/diagnostics';
import { collectColumnReferences } from '../draftSchemaAst';
import { buildSchemaColumnsByTable, normalizeIdentifier } from '../draftSchemaTopology';
import { toAstStatementArray } from '../sqlAstTypes';
import { pushDiagnostic } from './draftSchemaValidatorDiagnostics';

export function validateQueryColumns(
    statement: Exclude<ReturnType<typeof toAstStatementArray>[number], undefined>,
    queryTables: Set<string>,
    aliasToTable: Map<string, string>,
    schemaColumnsByTable: ReturnType<typeof buildSchemaColumnsByTable>,
    diagnostics: DraftDiagnostic[]
): void {
    const columnRefs: { column: string; table?: string }[] = [];
    collectColumnReferences(statement, columnRefs);

    for (const columnRef of columnRefs) {
        const normalizedColumn = normalizeIdentifier(columnRef.column);

        if (normalizedColumn === '*') continue;

        if (columnRef.table) {
            validateQualifiedColumn(columnRef, normalizedColumn, queryTables, aliasToTable, schemaColumnsByTable, diagnostics);

            continue;
        }

        validateUnqualifiedColumn(columnRef, normalizedColumn, queryTables, schemaColumnsByTable, diagnostics);
    }
}

function validateQualifiedColumn(
    columnRef: { column: string; table?: string },
    normalizedColumn: string,
    queryTables: Set<string>,
    aliasToTable: Map<string, string>,
    schemaColumnsByTable: ReturnType<typeof buildSchemaColumnsByTable>,
    diagnostics: DraftDiagnostic[]
): void {
    const tableRef = normalizeIdentifier(columnRef.table || '');
    const resolvedTable = aliasToTable.get(tableRef) || tableRef;
    const inQueryScope = queryTables.has(resolvedTable) || Array.from(queryTables).some((table) => {
        const tableBare = table.split('.').slice(-1)[0];
        const resolvedBare = resolvedTable.split('.').slice(-1)[0];

        return tableBare === resolvedBare;
    });

    if (!inQueryScope) {
        pushDiagnostic(diagnostics, {
            code: 'TABLE_NOT_IN_SCOPE',
            message: `Table "${resolvedTable}" is referenced by column "${columnRef.column}" but is not present in FROM/JOIN.`,
            table: resolvedTable,
            column: normalizedColumn
        });

        return;
    }

    const tableColumns = schemaColumnsByTable.get(resolvedTable);

    if (!tableColumns) {
        pushDiagnostic(diagnostics, {
            code: 'UNKNOWN_TABLE_REFERENCE',
            message: `Unknown table referenced by column "${columnRef.column}": ${resolvedTable}`,
            table: resolvedTable,
            column: normalizedColumn
        });

        return;
    }

    if (!tableColumns.has(normalizedColumn)) {
        pushDiagnostic(diagnostics, {
            code: 'UNKNOWN_COLUMN',
            message: `Unknown column "${columnRef.column}" in table "${resolvedTable}"`,
            table: resolvedTable,
            column: normalizedColumn
        });
    }
}

function validateUnqualifiedColumn(
    columnRef: { column: string; table?: string },
    normalizedColumn: string,
    queryTables: Set<string>,
    schemaColumnsByTable: ReturnType<typeof buildSchemaColumnsByTable>,
    diagnostics: DraftDiagnostic[]
): void {
    const matchedTables = Array.from(queryTables).filter((table) => schemaColumnsByTable.get(table)?.has(normalizedColumn));

    if (matchedTables.length === 0) {
        pushDiagnostic(diagnostics, {
            code: 'UNKNOWN_UNQUALIFIED_COLUMN',
            message: `Unknown column in draft SQL: ${columnRef.column}`,
            column: normalizedColumn
        });

        return;
    }

    if (matchedTables.length > 1) {
        pushDiagnostic(diagnostics, {
            code: 'AMBIGUOUS_COLUMN',
            message: `Column "${columnRef.column}" is ambiguous across joined tables: ${matchedTables.join(', ')}`,
            column: normalizedColumn
        });
    }
}
