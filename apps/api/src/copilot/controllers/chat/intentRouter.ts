export interface SuggestedDraft {
    mode: 'sql' | 'prisma';
    question: string;
    reason: string;
}

const retrievalSignals = [
    /\b(get|show|list|find|retrieve|select)\b/i,
    /\b(count|sum|avg|average|min|max|group by|order by|where|filter|join|top)\b/i,
    /\b(rows?|records?|entries|dataset|table)\b/i
];

function isRetrievalIntent(prompt: string): boolean {
    const normalized = prompt.trim();

    if (!normalized) return false;
    let hits = 0;

    for (const signal of retrievalSignals) {
        if (signal.test(normalized)) hits += 1;
    }

    return hits >= 1;
}

function resolvePreferredMode(prompt: string): 'sql' | 'prisma' {
    if (/\bprisma\b/i.test(prompt)) return 'prisma';

    return 'sql';
}

export function resolveSuggestedDraft(prompt: string): SuggestedDraft | null {
    if (!isRetrievalIntent(prompt)) return null;
    const mode = resolvePreferredMode(prompt);

    return {
        mode,
        question: prompt,
        reason: mode === 'prisma' ? 'Retrieval-like request detected. Generate a Prisma draft.' : 'Retrieval-like request detected. Generate a SQL draft.'
    };
}
