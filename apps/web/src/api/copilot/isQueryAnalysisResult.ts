import type { QueryAnalysisResult } from './queryAnalysisTypes';

export function isQueryAnalysisResult(value: unknown): value is QueryAnalysisResult {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    return Reflect.get(value, 'success') === true
        && (Reflect.get(value, 'mode') === 'explain' || Reflect.get(value, 'mode') === 'explain_analyze')
        && typeof Reflect.get(value, 'normalizedSql') === 'string'
        && Array.isArray(Reflect.get(value, 'referencedTables'))
        && Array.isArray(Reflect.get(value, 'indexes'))
        && Array.isArray(Reflect.get(value, 'tableStats'))
        && Array.isArray(Reflect.get(value, 'safetyNotes'))
        && Array.isArray(Reflect.get(value, 'findings'))
        && typeof Reflect.get(value, 'rawPlan') === 'object'
        && Reflect.get(value, 'rawPlan') !== null;
}
