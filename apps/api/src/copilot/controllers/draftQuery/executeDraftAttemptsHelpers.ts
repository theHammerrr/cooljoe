import { buildRepairConstraints } from './repairConstraints';
import { DraftDiagnostic, DraftValidationResult, diagnosticsToMessages } from './diagnostics';
import { buildValidationDrivenHints } from './validationHints';
import { buildRetryContextSubset } from './retryContext';
import { DraftTargetMode } from './buildDraftContext';
import { TableCatalogRow } from './models';

interface BuildRepairContextInput {
    attempt: number;
    context: Record<string, unknown>;
    constraints: unknown;
    validation: DraftValidationResult;
    schema: unknown;
    joinGraph: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
    requestedSchema?: string;
    sql: string;
}

export function getContextTableCatalog(context: Record<string, unknown>): TableCatalogRow[] {
    const tableCatalog = Reflect.get(context, 'tableCatalog');

    if (!Array.isArray(tableCatalog)) return [];

    return tableCatalog.filter((row): row is TableCatalogRow => {
        if (!row || typeof row !== 'object') return false;

        const table = Reflect.get(row, 'table');
        const columns = Reflect.get(row, 'columns');

        return typeof table === 'string' && Array.isArray(columns);
    });
}

export function buildRepairContext(input: BuildRepairContextInput) {
    const hints = input.attempt > 0 && input.validation.diagnostics.length > 0
        ? buildValidationDrivenHints(input.validation.diagnostics, input.schema, input.joinGraph, input.requestedSchema)
        : [];
    const retrySubset = input.attempt > 0
        ? buildRetryContextSubset(
            input.schema,
            input.joinGraph,
            Reflect.get(input.context, 'fullTableCatalog') ?? Reflect.get(input.context, 'tableCatalog'),
            input.validation.errors,
            input.sql
        )
        : null;

    return {
        context: {
            ...input.context,
            ...(retrySubset ? {
                schema: retrySubset.schema,
                joinGraph: retrySubset.joinGraph,
                tableCatalog: retrySubset.tableCatalog,
                repairFocusTables: retrySubset.focusTables,
                repairSchemaContext: retrySubset.schema
            } : {}),
            previousDraftSql: input.sql || undefined,
            validationIssues: input.validation.errors.length > 0 ? input.validation.errors : undefined,
            constraints: input.attempt > 0
                ? buildRepairConstraints(input.constraints, input.validation.errors, hints, input.sql, input.attempt === 2)
                : input.constraints
        },
        retryReason: input.validation.diagnostics.map((diagnostic) => diagnostic.code).join(' | ') || input.validation.errors.join(' | ')
    };
}

export function diagnosticsToValidation(diagnostics: DraftDiagnostic[]): DraftValidationResult {
    return {
        valid: false,
        errors: diagnosticsToMessages(diagnostics),
        diagnostics
    };
}

export function buildStructuredPlanError(): Error {
    return new Error('Structured plan is required when raw SQL fallback is not provided.');
}

export interface ExecuteDraftAttemptsServices {
    preferredMode: DraftTargetMode;
}
