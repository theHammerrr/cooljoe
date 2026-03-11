export interface ActiveDraftSession {
    requestId: string;
    statusToken: string;
    question: string;
    intent: 'sql' | 'prisma';
    constraints?: string;
    startedAt: number;
}

const ACTIVE_DRAFT_SESSION_KEY = 'cooljoe.activeDraftSession';

export function loadActiveDraftSession(): ActiveDraftSession | null {
    if (typeof window === 'undefined') return null;

    try {
        const rawValue = window.localStorage.getItem(ACTIVE_DRAFT_SESSION_KEY);

        if (!rawValue) return null;

        const parsed: unknown = JSON.parse(rawValue);

        if (!isActiveDraftSession(parsed)) return null;

        return parsed;
    } catch {
        return null;
    }
}

export function saveActiveDraftSession(session: ActiveDraftSession): void {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(ACTIVE_DRAFT_SESSION_KEY, JSON.stringify(session));
}

export function clearActiveDraftSession(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(ACTIVE_DRAFT_SESSION_KEY);
}

function isActiveDraftSession(value: unknown): value is ActiveDraftSession {
    if (!value || typeof value !== 'object') return false;

    return (
        typeof Reflect.get(value, 'requestId') === 'string' &&
        typeof Reflect.get(value, 'statusToken') === 'string' &&
        typeof Reflect.get(value, 'question') === 'string' &&
        (Reflect.get(value, 'intent') === 'sql' || Reflect.get(value, 'intent') === 'prisma') &&
        (Reflect.get(value, 'constraints') === undefined || typeof Reflect.get(value, 'constraints') === 'string') &&
        typeof Reflect.get(value, 'startedAt') === 'number'
    );
}
