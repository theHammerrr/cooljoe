interface OpsRequestLike {
    header(name: string): string | undefined;
    ip?: string;
    socket: {
        remoteAddress?: string;
    };
}

function getOpsToken(req: OpsRequestLike): string {
    const headerValue = req.header('x-ops-token');

    if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
        return headerValue.trim();
    }

    const authHeader = req.header('authorization');

    if (!authHeader) return '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);

    return match ? match[1].trim() : '';
}

function isLoopbackAddress(value: string | undefined): boolean {
    if (!value) return false;

    return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}

export function isAuthorizedOpsRequest(req: OpsRequestLike): boolean {
    if (process.env.NODE_ENV === 'test') return true;

    const configuredToken = process.env.OPS_API_TOKEN?.trim();

    if (configuredToken) {
        return getOpsToken(req) === configuredToken;
    }

    return isLoopbackAddress(req.ip) || isLoopbackAddress(req.socket.remoteAddress);
}
