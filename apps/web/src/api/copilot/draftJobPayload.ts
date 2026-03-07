export function isDraftJobBasePayload(payload: Record<string, unknown>): boolean {
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
