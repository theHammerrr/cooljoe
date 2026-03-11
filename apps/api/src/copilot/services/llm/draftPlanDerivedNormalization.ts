const VALID_TIME_GRAINS = new Set(['day', 'week', 'month', 'year']);

export function sanitizeDerivedOperations(
    copy: Record<string, unknown>,
    normalizeFieldRef: (value: unknown) => Record<string, unknown> | null
): void {
    const derived = Reflect.get(copy, 'derived');

    if (!Array.isArray(derived)) {
        delete copy.derived;

        return;
    }

    const normalizedDerived = derived
        .map((operation) => normalizeDerivedOperation(operation, normalizeFieldRef))
        .filter((operation): operation is Record<string, unknown> => operation !== null);

    if (normalizedDerived.length === 0) {
        delete copy.derived;

        return;
    }

    copy.derived = normalizedDerived;
}

function normalizeDerivedOperation(
    value: unknown,
    normalizeFieldRef: (value: unknown) => Record<string, unknown> | null
): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null) return null;

    const kind = Reflect.get(value, 'kind');

    if (typeof kind !== 'string') return null;

    if (kind === 'time_bucket') {
        return normalizeSingleSourceDerivedOperation(value, kind, 'source', normalizeFieldRef, true);
    }

    if (kind === 'distinct_count') {
        return normalizeSingleSourceDerivedOperation(value, kind, 'source', normalizeFieldRef, false);
    }

    if (kind === 'change_vs_previous_period') {
        return normalizeSingleSourceDerivedOperation(value, kind, 'source', normalizeFieldRef, false);
    }

    if (kind === 'ratio') {
        const numerator = normalizeFieldRef(Reflect.get(value, 'numerator'));
        const denominator = normalizeFieldRef(Reflect.get(value, 'denominator'));

        if (!numerator || !denominator) return null;

        return appendAlias(value, { kind, numerator, denominator });
    }

    return null;
}

function normalizeSingleSourceDerivedOperation(
    value: object,
    kind: string,
    sourceKey: string,
    normalizeFieldRef: (value: unknown) => Record<string, unknown> | null,
    requireGrain: boolean
): Record<string, unknown> | null {
    const source = normalizeFieldRef(Reflect.get(value, sourceKey));

    if (!source) return null;

    const normalized: Record<string, unknown> = { kind, source };

    if (requireGrain) {
        const grain = Reflect.get(value, 'grain');

        if (typeof grain !== 'string' || !VALID_TIME_GRAINS.has(grain.toLowerCase())) {
            return null;
        }

        normalized.grain = grain.toLowerCase();
    }

    return appendAlias(value, normalized);
}

function appendAlias(value: object, normalized: Record<string, unknown>): Record<string, unknown> {
    const alias = Reflect.get(value, 'alias');

    if (typeof alias === 'string' && alias.trim().length > 0) {
        normalized.alias = alias.trim();
    }

    return normalized;
}
