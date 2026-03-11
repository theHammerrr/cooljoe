import { SemanticQueryPlan } from '../services/queryCompiler/types';
import { buildApiDraftPayload } from '../controllers/draftQuery/buildDraftContext';

interface ClarificationPayload {
    type: 'clarification_required';
    message: string;
    missing: string[];
    intentSketch?: unknown;
}

interface ValidationErrorPayloadInput {
    error: string;
    issues: string[];
    diagnostics?: unknown[];
    draft?: Record<string, unknown>;
}

export function buildQueryDraftResultPayload(requestId: string, draft: SemanticQueryPlan, sql: string) {
    return {
        kind: 'query',
        query: {
            ...buildApiDraftPayload(draft, sql),
            requestId
        }
    };
}

export function buildClarificationDraftResultPayload(payload: ClarificationPayload) {
    return {
        kind: 'clarification',
        clarification: payload
    };
}

export function buildValidationErrorDraftResultPayload(input: ValidationErrorPayloadInput) {
    return {
        kind: 'validation_error',
        error: input.error,
        issues: input.issues,
        diagnostics: input.diagnostics || [],
        draft: input.draft
    };
}

export function buildRuntimeErrorDraftResultPayload(error: string, details?: Record<string, unknown>) {
    return {
        kind: 'runtime_error',
        error,
        ...details
    };
}
