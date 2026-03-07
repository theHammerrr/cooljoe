import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAuthorizedOpsRequest } from './opsAuth';

describe('isAuthorizedOpsRequest', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.NODE_ENV = 'development';
        process.env.OPS_API_TOKEN = 'secret-token';
    });

    it('rejects requests without the configured ops token', () => {
        const req = {
            header: vi.fn().mockReturnValue(undefined),
            ip: '10.0.0.5',
            socket: { remoteAddress: '10.0.0.5' }
        };

        expect(isAuthorizedOpsRequest(req)).toBe(false);
    });

    it('accepts requests with the configured x-ops-token header', () => {
        const req = {
            header: vi.fn((name: string) => name === 'x-ops-token' ? 'secret-token' : undefined),
            ip: '10.0.0.5',
            socket: { remoteAddress: '10.0.0.5' }
        };

        expect(isAuthorizedOpsRequest(req)).toBe(true);
    });
});
