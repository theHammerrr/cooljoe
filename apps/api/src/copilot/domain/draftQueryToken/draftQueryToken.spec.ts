import { describe, expect, it } from 'vitest';
import { issueDraftStatusToken, verifyDraftStatusToken } from './draftQueryToken';

describe('draftQueryToken', () => {
    it('verifies issued token for same request id', () => {
        const requestId = 'draft_test_123';
        const issued = issueDraftStatusToken(requestId);
        expect(verifyDraftStatusToken(issued.token, requestId)).toBe(true);
    });

    it('rejects token for different request id', () => {
        const issued = issueDraftStatusToken('draft_test_123');
        expect(verifyDraftStatusToken(issued.token, 'draft_test_456')).toBe(false);
    });
});
