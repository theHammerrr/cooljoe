import { describe, expect, it } from 'vitest';
import { parseChatStreamEvent } from './useChatStreamEvents';

describe('parseChatStreamEvent', () => {
    it('parses delta events', () => {
        expect(parseChatStreamEvent({ type: 'delta', text: 'hello' })).toEqual({ type: 'delta', text: 'hello' });
    });

    it('parses done events with valid suggested draft payload', () => {
        expect(parseChatStreamEvent({
            type: 'done',
            message: 'final answer',
            suggestedDraft: {
                question: 'q',
                mode: 'sql',
                reason: 'r'
            }
        })).toEqual({
            type: 'done',
            message: 'final answer',
            suggestedDraft: {
                question: 'q',
                mode: 'sql',
                reason: 'r',
                constraints: undefined,
                ctaLabel: undefined
            }
        });
    });

    it('drops invalid suggested draft payloads', () => {
        expect(parseChatStreamEvent({
            type: 'done',
            message: 'final answer',
            suggestedDraft: {
                question: 123,
                mode: 'sql'
            }
        })).toEqual({
            type: 'done',
            message: 'final answer',
            suggestedDraft: undefined
        });
    });
});
