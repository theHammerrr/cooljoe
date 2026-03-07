import { isClarificationPayload, isQueryBlock } from '../../copilot/types';
import type { DraftJobPayload } from './draftJobPayloadTypes';

export function isDraftJobBasePayload(payload: unknown): payload is Record<string, unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return false;
    }

    return (
        typeof Reflect.get(payload, 'requestId') === 'string' &&
        typeof Reflect.get(payload, 'status') === 'string' &&
        typeof Reflect.get(payload, 'stage') === 'string' &&
        typeof Reflect.get(payload, 'done') === 'boolean' &&
        typeof Reflect.get(payload, 'updatedAt') === 'number' &&
        typeof Reflect.get(payload, 'question') === 'string' &&
        typeof Reflect.get(payload, 'preferredMode') === 'string' &&
        typeof Reflect.get(payload, 'recoveryCount') === 'number' &&
        typeof Reflect.get(payload, 'createdAt') === 'number'
    );
}

function readString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is string => typeof item === 'string');
}

function readObject(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

    return Object.fromEntries(Object.entries(value));
}

function parseTypedDraftJobPayload(payload: Record<string, unknown>): DraftJobPayload | undefined {
    const kind = readString(payload.kind);

    if (kind === 'query' && isQueryBlock(payload.query)) {
        return { kind, query: payload.query };
    }

    if (kind === 'clarification' && isClarificationPayload(payload.clarification)) {
        return { kind, clarification: payload.clarification };
    }

    if (kind === 'validation_error') {
        return {
            kind,
            error: readString(payload.error) || 'Generated SQL failed schema validation.',
            issues: readStringArray(payload.issues),
            diagnostics: Array.isArray(payload.diagnostics) ? payload.diagnostics : [],
            draft: isQueryBlock(payload.draft) ? payload.draft : undefined
        };
    }

    if (kind === 'runtime_error' && readString(payload.error)) {
        return {
            kind,
            error: readString(payload.error) || 'Draft job failed.'
        };
    }

    return undefined;
}

function parseLegacyDraftJobPayload(payload: Record<string, unknown>, resultStatus?: number): DraftJobPayload | undefined {
    if (isQueryBlock(payload)) {
        return { kind: 'query', query: payload };
    }

    if (isClarificationPayload(payload)) {
        return { kind: 'clarification', clarification: payload };
    }

    const error = readString(payload.error);
    const issues = readStringArray(payload.issues);

    if (!error && issues.length === 0) return undefined;

    if (issues.length > 0 || resultStatus === 422) {
        return {
            kind: 'validation_error',
            error: error || 'Generated SQL failed schema validation.',
            issues,
            diagnostics: Array.isArray(payload.diagnostics) ? payload.diagnostics : [],
            draft: isQueryBlock(payload.draft) ? payload.draft : undefined
        };
    }

    return {
        kind: 'runtime_error',
        error: error || 'Draft job failed.'
    };
}

export function parseDraftJobPayload(payload: unknown, resultStatus?: number): DraftJobPayload | undefined {
    const objectPayload = readObject(payload);

    if (!objectPayload) return undefined;

    return parseTypedDraftJobPayload(objectPayload) || parseLegacyDraftJobPayload(objectPayload, resultStatus);
}
