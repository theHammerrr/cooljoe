import { sanitizeDerivedOperations as sanitizeDerivedOperationsWithHelper } from './draftPlanDerivedNormalization';

const VALID_TIME_GRAINS = new Set(['day', 'week', 'month', 'year']);
const VALID_ORDER_DIRECTIONS = new Set(['asc', 'desc']);
const VALID_AGGREGATIONS = new Set(['count', 'sum', 'avg', 'min', 'max']);

export function sanitizeLimit(copy: Record<string, unknown>): void {
    const limit = Reflect.get(copy, 'limit');

    if (typeof limit !== 'number' || !Number.isFinite(limit)) {
        delete copy.limit;

        return;
    }

    copy.limit = Math.max(1, Math.min(100, Math.floor(limit)));
}

export function sanitizeRawSqlFallback(copy: Record<string, unknown>): void {
    const rawSqlFallback = Reflect.get(copy, 'raw_sql_fallback');

    if (typeof rawSqlFallback === 'string' && rawSqlFallback.trim().length > 0) {
        copy.raw_sql_fallback = rawSqlFallback.trim();

        return;
    }

    delete copy.raw_sql_fallback;

    if (Reflect.get(copy, 'requires_raw_sql') === true) {
        copy.requires_raw_sql = false;
    }
}

export function sanitizeTimeSemantics(copy: Record<string, unknown>): void {
    const time = Reflect.get(copy, 'time');

    if (typeof time !== 'object' || time === null) {
        delete copy.time;

        return;
    }

    const grain = Reflect.get(time, 'grain');

    if (typeof grain !== 'string' || !VALID_TIME_GRAINS.has(grain.toLowerCase())) {
        delete copy.time;

        return;
    }

    const normalizedTime: Record<string, unknown> = { grain: grain.toLowerCase() };
    const dimension = normalizeFieldRef(Reflect.get(time, 'dimension'));

    if (dimension) normalizedTime.dimension = dimension;

    const range = Reflect.get(time, 'range');

    if (typeof range === 'string' && range.trim().length > 0) {
        normalizedTime.range = range.trim();
    }

    copy.time = normalizedTime;
}

export function sanitizeRankingSemantics(copy: Record<string, unknown>): void {
    const ranking = Reflect.get(copy, 'ranking');

    if (typeof ranking !== 'object' || ranking === null) {
        delete copy.ranking;

        return;
    }

    const limit = Reflect.get(ranking, 'limit');
    const normalizedLimit = typeof limit === 'number' && Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : undefined;

    if (normalizedLimit === undefined) {
        delete copy.ranking;

        return;
    }

    const direction = Reflect.get(ranking, 'direction');
    const normalizedDirection = typeof direction === 'string' && VALID_ORDER_DIRECTIONS.has(direction.toLowerCase())
        ? direction.toLowerCase()
        : 'desc';
    const normalizedRanking: Record<string, unknown> = {
        limit: normalizedLimit,
        direction: normalizedDirection
    };
    const target = normalizeFieldRef(Reflect.get(ranking, 'target'));

    if (target) normalizedRanking.target = target;

    const agg = Reflect.get(ranking, 'agg');

    if (typeof agg === 'string' && VALID_AGGREGATIONS.has(agg.toLowerCase())) {
        normalizedRanking.agg = agg.toLowerCase();
    }

    copy.ranking = normalizedRanking;
}

export function sanitizeDerivedOperations(copy: Record<string, unknown>): void {
    sanitizeDerivedOperationsWithHelper(copy, normalizeFieldRef);
}

function normalizeFieldRef(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null) return null;

    const table = Reflect.get(value, 'table');
    const column = Reflect.get(value, 'column');

    if (typeof table !== 'string' || table.trim().length === 0 || typeof column !== 'string' || column.trim().length === 0) {
        return null;
    }

    const normalized: Record<string, unknown> = {
        table: table.trim(),
        column: column.trim()
    };

    const tableRef = Reflect.get(value, 'tableRef');

    if (typeof tableRef === 'string' && tableRef.trim().length > 0) {
        normalized.tableRef = tableRef.trim();
    }

    const role = Reflect.get(value, 'role');

    if (typeof role === 'string' && role.trim().length > 0) {
        normalized.role = role.trim();
    }

    const alias = Reflect.get(value, 'alias');

    if (typeof alias === 'string' && alias.trim().length > 0) {
        normalized.alias = alias.trim();
    }

    return normalized;
}
