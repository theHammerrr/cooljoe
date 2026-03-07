import { DraftDiagnostic } from '../../controllers/draftQuery/diagnostics';
import { buildSchemaColumnsByTable, normalizeIdentifier } from '../draftSchemaTopology';
import { pushDiagnostic } from './draftSchemaValidatorDiagnostics';

export function validateQueryTables(
    queryTables: Set<string>,
    schemaColumnsByTable: ReturnType<typeof buildSchemaColumnsByTable>,
    normalizedRequiredSchema: string,
    diagnostics: DraftDiagnostic[]
): void {
    for (const table of queryTables) {
        if (!schemaColumnsByTable.has(table)) {
            pushDiagnostic(diagnostics, { code: 'UNKNOWN_TABLE', message: `Unknown table in draft SQL: ${table}`, table });
        }

        if (!normalizedRequiredSchema) continue;
        const parts = table.split('.');

        if (parts.length < 2) {
            pushDiagnostic(diagnostics, {
                code: 'MISSING_SCHEMA_QUALIFIER',
                message: `Table "${table}" must be schema-qualified with "${normalizedRequiredSchema}".`,
                table
            });

            continue;
        }

        if (normalizeIdentifier(parts[0]) !== normalizedRequiredSchema) {
            pushDiagnostic(diagnostics, {
                code: 'WRONG_SCHEMA',
                message: `Table "${table}" is not in required schema "${normalizedRequiredSchema}".`,
                table
            });
        }
    }
}
