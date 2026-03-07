import { describe, expect, it } from 'vitest';
import { DraftQueryCommandSchema } from './draftQuery';

describe('DraftQueryCommandSchema', () => {
    it('accepts valid payload and defaults preferred mode', () => {
        const parsed = DraftQueryCommandSchema.parse({ question: 'list employees' });
        expect(parsed.preferred).toBe('sql');
    });

    it('rejects missing or empty question', () => {
        expect(() => DraftQueryCommandSchema.parse({ question: '' })).toThrowError();
        expect(() => DraftQueryCommandSchema.parse({})).toThrowError();
    });

    it('rejects invalid requestId format', () => {
        expect(() => DraftQueryCommandSchema.parse({ question: 'x', requestId: 'bad id with spaces' })).toThrowError();
    });
});
