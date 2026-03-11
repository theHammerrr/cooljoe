export type DraftDiagnosticCode =
    | 'INVALID_SCHEMA_SNAPSHOT'
    | 'INVALID_SQL_SYNTAX'
    | 'UNSUPPORTED_SQL_STATEMENT'
    | 'MULTI_STATEMENT_NOT_ALLOWED'
    | 'NON_SELECT_QUERY'
    | 'UNKNOWN_TABLE'
    | 'AMBIGUOUS_COLUMN'
    | 'MISSING_SCHEMA_QUALIFIER'
    | 'WRONG_SCHEMA'
    | 'TABLE_NOT_IN_SCOPE'
    | 'UNKNOWN_TABLE_REFERENCE'
    | 'UNKNOWN_COLUMN'
    | 'UNKNOWN_UNQUALIFIED_COLUMN'
    | 'INVALID_JOIN_RELATION'
    | 'LOW_CONFIDENCE_ECHO'
    | 'MISSING_NAME_COLUMNS'
    | 'PLAN_OUTSIDE_CANDIDATE_SCOPE'
    | 'PLAN_OUTSIDE_COLUMN_SCOPE'
    | 'PLAN_INVALID_JOIN_PATH'
    | 'PLAN_MISSING_ENTITY'
    | 'UNSUPPORTED_DERIVED_OPERATION'
    | 'MISSING_AGGREGATION'
    | 'MISSING_ORDER_BY'
    | 'MISSING_LIMIT'
    | 'MISSING_TIME_BUCKET'
    | 'MISSING_TIME_FILTER'
    | 'DATABASE_DRY_RUN_FAILED'
    | 'ZOD_SCHEMA_ERROR'
    | 'COMPILATION_ERROR';

export interface DraftDiagnostic {
    code: DraftDiagnosticCode;
    message: string;
    table?: string;
    column?: string;
}

export interface DraftValidationResult {
    valid: boolean;
    errors: string[];
    diagnostics: DraftDiagnostic[];
}

export function diagnosticsToMessages(diagnostics: DraftDiagnostic[]): string[] {
    return diagnostics.map((diagnostic) => diagnostic.message);
}
