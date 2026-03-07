import { DraftDiagnostic, DraftValidationResult, diagnosticsToMessages } from '../../controllers/draftQuery/diagnostics';

export function buildValidationResult(diagnostics: DraftDiagnostic[]): DraftValidationResult {
    return {
        valid: diagnostics.length === 0,
        errors: diagnosticsToMessages(diagnostics),
        diagnostics
    };
}

export function pushDiagnostic(target: DraftDiagnostic[], diagnostic: DraftDiagnostic): void {
    const key = `${diagnostic.code}:${diagnostic.message}`;

    if (target.some((entry) => `${entry.code}:${entry.message}` === key)) return;

    target.push(diagnostic);
}
