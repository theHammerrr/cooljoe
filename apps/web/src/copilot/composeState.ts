export type ComposeMode = 'chat' | 'sql' | 'prisma';

interface ComposeState {
    input: string;
    mode: ComposeMode;
}

const COMPOSE_STATE_KEY = 'cooljoe.copilotComposeState';

export function loadComposeState(): ComposeState {
    if (typeof window === 'undefined') {
        return { input: '', mode: 'chat' };
    }

    try {
        const rawValue = window.localStorage.getItem(COMPOSE_STATE_KEY);

        if (!rawValue) {
            return { input: '', mode: 'chat' };
        }

        const parsed: unknown = JSON.parse(rawValue);

        if (!parsed || typeof parsed !== 'object') {
            return { input: '', mode: 'chat' };
        }

        const input = Reflect.get(parsed, 'input');
        const mode = Reflect.get(parsed, 'mode');

        return {
            input: typeof input === 'string' ? input : '',
            mode: mode === 'chat' || mode === 'sql' || mode === 'prisma' ? mode : 'chat'
        };
    } catch {
        return { input: '', mode: 'chat' };
    }
}

export function saveComposeState(input: string, mode: ComposeMode): void {
    if (typeof window === 'undefined') return;

    if (!input && mode === 'chat') {
        window.localStorage.removeItem(COMPOSE_STATE_KEY);

        return;
    }

    window.localStorage.setItem(COMPOSE_STATE_KEY, JSON.stringify({ input, mode }));
}

export function clearComposeState(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(COMPOSE_STATE_KEY);
}
