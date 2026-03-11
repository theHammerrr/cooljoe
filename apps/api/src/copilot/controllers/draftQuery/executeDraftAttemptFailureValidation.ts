import { ZodError } from 'zod';
import { DraftDiagnostic, DraftValidationResult, diagnosticsToMessages } from './diagnostics';

export function toAttemptFailureValidation(err: unknown): DraftValidationResult {
    if (err instanceof ZodError) {
        console.log({ err });
        const diagnostics: DraftDiagnostic[] = err.issues.map((issue) => ({
            code: 'ZOD_SCHEMA_ERROR',
            message: `Zod Schema Error at ${issue.path.join('.')}: ${issue.message}`
        }));

        return { valid: false, errors: diagnosticsToMessages(diagnostics), diagnostics };
    }

    if (err instanceof Error) {
        return {
            valid: false,
            errors: [err.message],
            diagnostics: [{ code: 'COMPILATION_ERROR', message: err.message }]
        };
    }

    return {
        valid: false,
        errors: ['Unknown compilation error'],
        diagnostics: [{ code: 'COMPILATION_ERROR', message: 'Unknown compilation error' }]
    };
}
