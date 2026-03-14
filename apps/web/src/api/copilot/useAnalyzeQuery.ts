import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

export interface QueryAnalysisFinding {
    severity: 'low' | 'medium' | 'high';
    category: 'query_shape' | 'index' | 'scan' | 'join' | 'sort';
    title: string;
    evidence: string[];
    suggestion: string;
    confidence: 'high' | 'medium';
    isHeuristic: boolean;
}

export interface QueryAnalysisIndexMetadata {
    schemaName: string;
    tableName: string;
    indexName: string;
    accessMethod: string;
    isPrimary: boolean;
    isUnique: boolean;
    columns: string[];
    definition: string;
}

export interface QueryAnalysisPlanNode {
    nodeType: string;
    relationName?: string;
    schema?: string;
    alias?: string;
    startupCost?: number;
    totalCost?: number;
    planRows?: number;
    planWidth?: number;
    filter?: string;
    indexName?: string;
    indexCond?: string;
    recheckCond?: string;
    hashCond?: string;
    mergeCond?: string;
    joinFilter?: string;
    joinType?: string;
    sortKey?: string[];
    plans: QueryAnalysisPlanNode[];
}

export interface QueryAnalysisResult {
    success: true;
    mode: 'explain';
    normalizedSql: string;
    referencedTables: string[];
    indexes: QueryAnalysisIndexMetadata[];
    findings: QueryAnalysisFinding[];
    rawPlan: QueryAnalysisPlanNode;
}

interface AnalyzeQueryParams {
    query: string;
    mode?: 'explain';
}

function isQueryAnalysisResult(value: unknown): value is QueryAnalysisResult {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    return Reflect.get(value, 'success') === true
        && Reflect.get(value, 'mode') === 'explain'
        && typeof Reflect.get(value, 'normalizedSql') === 'string'
        && Array.isArray(Reflect.get(value, 'referencedTables'))
        && Array.isArray(Reflect.get(value, 'indexes'))
        && Array.isArray(Reflect.get(value, 'findings'))
        && typeof Reflect.get(value, 'rawPlan') === 'object'
        && Reflect.get(value, 'rawPlan') !== null;
}

export const useAnalyzeQuery = () => {
    return useMutation({
        mutationFn: async ({ query, mode = 'explain' }: AnalyzeQueryParams): Promise<QueryAnalysisResult> => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/analyze-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, mode })
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok || !Reflect.get(payload, 'success')) {
                throw new Error(typeof Reflect.get(payload, 'error') === 'string' ? String(Reflect.get(payload, 'error')) : 'Failed to analyze query');
            }

            if (!isQueryAnalysisResult(payload)) {
                throw new Error('Invalid query analysis payload');
            }

            return payload;
        }
    });
};
