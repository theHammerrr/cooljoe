import type { SuggestedDraftPayload } from './useChat.types';

interface StreamDoneEvent {
    type: 'done';
    message: string;
    suggestedDraft?: SuggestedDraftPayload | null;
}

interface StreamDeltaEvent {
    type: 'delta';
    text: string;
}

interface StreamErrorEvent {
    type: 'error';
    error: string;
}

interface StreamStartEvent {
    type: 'start';
}

export type ChatStreamEvent = StreamDoneEvent | StreamDeltaEvent | StreamErrorEvent | StreamStartEvent;

export function parseChatStreamEvent(value: unknown): ChatStreamEvent | null {
    if (typeof value !== 'object' || value === null) {
        return null;
    }

    const type = Reflect.get(value, 'type');

    if (type === 'start') {
        return { type: 'start' };
    }

    if (type === 'delta') {
        const text = Reflect.get(value, 'text');

        return typeof text === 'string' ? { type: 'delta', text } : null;
    }

    if (type === 'done') {
        const message = Reflect.get(value, 'message');

        if (typeof message !== 'string') {
            return null;
        }

        return {
            type: 'done',
            message,
            suggestedDraft: parseSuggestedDraft(Reflect.get(value, 'suggestedDraft'))
        };
    }

    if (type === 'error') {
        const error = Reflect.get(value, 'error');

        return typeof error === 'string' ? { type: 'error', error } : null;
    }

    return null;
}

function parseSuggestedDraft(value: unknown): SuggestedDraftPayload | null | undefined {
    if (value === null) {
        return null;
    }

    if (typeof value === 'undefined') {
        return undefined;
    }

    if (typeof value !== 'object' || value === null) {
        return undefined;
    }

    const question = Reflect.get(value, 'question');
    const mode = Reflect.get(value, 'mode');

    if (typeof question !== 'string' || (mode !== 'sql' && mode !== 'prisma')) {
        return undefined;
    }

    return {
        question,
        mode,
        reason: optionalString(Reflect.get(value, 'reason')),
        constraints: optionalString(Reflect.get(value, 'constraints')),
        ctaLabel: optionalString(Reflect.get(value, 'ctaLabel'))
    };
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}
