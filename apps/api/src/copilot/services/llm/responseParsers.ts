import { SemanticQueryPlan, SemanticQueryPlanSchema } from '../queryCompiler/types';

interface ExplanationResponse {
    explanation: string;
    followUps: string[];
}

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

function normalizeDraftPlanShape(parsed: unknown): unknown {
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

    // Bridge legacy model output (`sql`) into the raw fallback contract.
    if (typeof legacySql === 'string' && legacySql.trim() && typeof rawSqlFallback !== 'string') {
        copy.raw_sql_fallback = legacySql;
    }

    // If we have fallback SQL but no explicit mode, force raw mode.
    if (typeof Reflect.get(copy, 'raw_sql_fallback') === 'string' && typeof requiresRawSql !== 'boolean') {
        copy.requires_raw_sql = true;
    }

    // If select is missing entirely and fallback SQL exists, keep plan parseable as raw mode.
    const normalizedSelect = Reflect.get(copy, 'select');

    if (!Array.isArray(normalizedSelect) && typeof Reflect.get(copy, 'raw_sql_fallback') === 'string') {
        copy.select = [];
        copy.requires_raw_sql = true;
    }

    console.log('[responseParsers] normalized:', copy);

    return copy;
}

export function parseDraftResponse(content: string | null | undefined): SemanticQueryPlan {
    let parsedJson = {};

    try {
        parsedJson = JSON.parse(content || '{}');
    } catch {
        // Fallback to extraction if LLM wrapped in markdown blocks
        const match = content?.match(/```(?:json)?([\s\S]*?)```/);

        if (match) {
            parsedJson = JSON.parse(match[1]);
        }
    }

    const normalizedPlan = normalizeDraftPlanShape(parsedJson);

    return SemanticQueryPlanSchema.parse(normalizedPlan);
}

export function parseExplanationResponse(content: string | null | undefined): ExplanationResponse {
    const parsed = JSON.parse(content || '{}');

    return {
        explanation: parsed.explanation || '',
        followUps: parsed.followUps || []
    };
}
