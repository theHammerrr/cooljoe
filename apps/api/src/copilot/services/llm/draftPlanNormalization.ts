import {
    sanitizeDerivedOperations,
    sanitizeLimit,
    sanitizeRankingSemantics,
    sanitizeRawSqlFallback,
    sanitizeTimeSemantics
} from './draftPlanNormalizationHelpers';

function stripIdentifierQuotes(value: string): string {
    return value.replace(/^"+|"+$/g, '');
}

function parseSelectString(value: string): { table: string; column: string } | null {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const parts = trimmed.split('.').map((part) => stripIdentifierQuotes(part));

    if (parts.length < 2) {
        return null;
    }

    const column = parts[parts.length - 1];
    const table = parts.slice(0, -1).join('.');

    if (!table || !column) {
        return null;
    }

    return { table, column };
}

export function normalizeDraftPlanShape(parsed: unknown): unknown {
    console.log('[responseParsers] parsed:', parsed);

    if (typeof parsed !== 'object' || parsed === null) {
        return parsed;
    }

    const copy: Record<string, unknown> = { ...parsed };
    const selectRaw = Reflect.get(copy, 'select');

    if (Array.isArray(selectRaw)) {
        copy.select = selectRaw.map((item) => {
            if (typeof item !== 'string') {
                return item;
            }

            const parsedSelect = parseSelectString(item);

            return parsedSelect || item;
        });
    }

    const legacySql = Reflect.get(copy, 'sql');
    const rawSqlFallback = Reflect.get(copy, 'raw_sql_fallback');
    const requiresRawSql = Reflect.get(copy, 'requires_raw_sql');

    if (typeof legacySql === 'string' && legacySql.trim() && typeof rawSqlFallback !== 'string') {
        copy.raw_sql_fallback = legacySql;
    }

    if (typeof Reflect.get(copy, 'raw_sql_fallback') === 'string' && typeof requiresRawSql !== 'boolean') {
        copy.requires_raw_sql = true;
    }

    const normalizedSelect = Reflect.get(copy, 'select');

    if (!Array.isArray(normalizedSelect) && typeof Reflect.get(copy, 'raw_sql_fallback') === 'string') {
        copy.select = [];
        copy.requires_raw_sql = true;
    }

    sanitizeRawSqlFallback(copy);
    sanitizeLimit(copy);
    sanitizeTimeSemantics(copy);
    sanitizeRankingSemantics(copy);
    sanitizeDerivedOperations(copy);

    console.log('[responseParsers] normalized:', copy);

    return copy;
}

export function looksLikeLegacySemanticPlan(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;

    return ['select', 'joins', 'groupBy', 'orderBy'].some((key) => Reflect.has(value, key));
}
