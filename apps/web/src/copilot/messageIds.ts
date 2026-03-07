export function createMessageId(prefix = 'msg'): string {
    const randomUuid = globalThis.crypto?.randomUUID?.();

    if (typeof randomUuid === 'string' && randomUuid.length > 0) {
        return `${prefix}-${randomUuid}`;
    }

    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
