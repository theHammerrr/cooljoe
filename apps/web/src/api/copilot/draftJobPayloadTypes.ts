import type { ClarificationPayload, QueryBlock } from '../../copilot/types';

export interface QueryDraftJobPayload {
    kind: 'query';
    query: QueryBlock;
}

export interface ClarificationDraftJobPayload {
    kind: 'clarification';
    clarification: ClarificationPayload;
}

export interface ValidationErrorDraftJobPayload {
    kind: 'validation_error';
    error: string;
    issues: string[];
    diagnostics?: unknown[];
    draft?: QueryBlock;
}

export interface RuntimeErrorDraftJobPayload {
    kind: 'runtime_error';
    error: string;
}

export type DraftJobPayload =
    | QueryDraftJobPayload
    | ClarificationDraftJobPayload
    | ValidationErrorDraftJobPayload
    | RuntimeErrorDraftJobPayload;
