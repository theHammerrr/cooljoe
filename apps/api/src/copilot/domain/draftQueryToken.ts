import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const secret = process.env.DRAFT_STATUS_TOKEN_SECRET || randomBytes(32).toString('hex');

function toBase64Url(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string): string {
    return createHmac('sha256', secret).update(payload).digest('base64url');
}

function isDraftTokenPayload(value: unknown): value is { requestId: string; expiresAt: number } {
    if (!value || typeof value !== 'object') return false;

    if (!('requestId' in value) || !('expiresAt' in value)) return false;

    return typeof value.requestId === 'string' && typeof value.expiresAt === 'number';
}

export function issueDraftStatusToken(requestId: string): { token: string; expiresAt: number } {
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    const payload = toBase64Url(JSON.stringify({ requestId, expiresAt }));
    const signature = sign(payload);

    return { token: `${payload}.${signature}`, expiresAt };
}

export function verifyDraftStatusToken(token: string, requestId: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const [payload, receivedSignature] = token.split('.');

    if (!payload || !receivedSignature) return false;

    const expectedSignature = sign(payload);
    const received = Buffer.from(receivedSignature);
    const expected = Buffer.from(expectedSignature);

    if (received.length !== expected.length) return false;

    if (!timingSafeEqual(received, expected)) return false;

    try {
        const parsed = JSON.parse(fromBase64Url(payload));

        if (!isDraftTokenPayload(parsed)) return false;

        if (parsed.requestId !== requestId) return false;

        return parsed.expiresAt > Date.now();
    } catch {
        return false;
    }
}
