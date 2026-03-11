type WorkspaceRowValue = string | number | boolean | null;
type WorkspaceRow = Record<string, WorkspaceRowValue>;

interface WorkspaceSnapshot {
    tableResults?: WorkspaceRow[];
}

const WORKSPACE_SNAPSHOT_KEY = 'cooljoe.copilotWorkspace';
const MAX_PERSISTED_RESULT_ROWS = 100;

export function loadWorkspaceSnapshot(): { tableResults: Record<string, unknown>[] | null } {
    if (typeof window === 'undefined') {
        return { tableResults: null };
    }

    try {
        const rawValue = window.localStorage.getItem(WORKSPACE_SNAPSHOT_KEY);

        if (!rawValue) {
            return { tableResults: null };
        }

        const parsed: unknown = JSON.parse(rawValue);

        if (!parsed || typeof parsed !== 'object') {
            return { tableResults: null };
        }

        const tableResults = Reflect.get(parsed, 'tableResults');

        return {
            tableResults: Array.isArray(tableResults) ? tableResults.filter(isWorkspaceRow) : null
        };
    } catch {
        return { tableResults: null };
    }
}

export function saveWorkspaceSnapshot(tableResults: Record<string, unknown>[] | null): void {
    if (typeof window === 'undefined') return;

    const sanitizedRows = sanitizeTableResults(tableResults);

    if (!sanitizedRows) {
        window.localStorage.removeItem(WORKSPACE_SNAPSHOT_KEY);

        return;
    }

    const snapshot: WorkspaceSnapshot = {
        tableResults: sanitizedRows
    };

    window.localStorage.setItem(WORKSPACE_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function clearWorkspaceSnapshot(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(WORKSPACE_SNAPSHOT_KEY);
}

function sanitizeTableResults(tableResults: Record<string, unknown>[] | null): WorkspaceRow[] | null {
    if (!tableResults) return null;

    return tableResults
        .slice(0, MAX_PERSISTED_RESULT_ROWS)
        .map(sanitizeWorkspaceRow);
}

function sanitizeWorkspaceRow(row: Record<string, unknown>): WorkspaceRow {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, sanitizeWorkspaceValue(value)])
    );
}

function sanitizeWorkspaceValue(value: unknown): WorkspaceRowValue {
    if (value === null) return null;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;

    return String(value);
}

function isWorkspaceRow(value: unknown): value is WorkspaceRow {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    return Object.values(value).every(isWorkspaceRowValue);
}

function isWorkspaceRowValue(value: unknown): value is WorkspaceRowValue {
    return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
