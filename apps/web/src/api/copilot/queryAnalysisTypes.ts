export type QueryAnalysisMode = 'explain' | 'explain_analyze';

export interface QueryAnalysisFinding {
    severity: 'low' | 'medium' | 'high';
    category: 'query_shape' | 'index' | 'scan' | 'join' | 'sort';
    title: string;
    evidence: string[];
    evidenceSources: Array<'plan' | 'metadata' | 'sql_shape'>;
    runtimeContext?: QueryAnalysisFindingRuntimeContext;
    suggestion: string;
    confidence: 'high' | 'medium';
    isHeuristic: boolean;
}

export interface QueryAnalysisFindingRuntimeContext {
    nodeId: string;
    nodeType: string;
    estimatedRows?: number;
    actualRows?: number;
    actualLoops?: number;
    actualTotalTimeMs?: number;
    driftRatio?: number;
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
    nodeId: string;
    nodeType: string;
    sqlReferences: string[];
    relationName?: string;
    schema?: string;
    alias?: string;
    startupCost?: number;
    totalCost?: number;
    planRows?: number;
    planWidth?: number;
    actualStartupTime?: number;
    actualTotalTime?: number;
    actualRows?: number;
    actualLoops?: number;
    filter?: string;
    indexName?: string;
    indexCond?: string;
    recheckCond?: string;
    hashCond?: string;
    mergeCond?: string;
    joinFilter?: string;
    joinType?: string;
    sortKey?: string[];
    buffers?: {
        sharedHitBlocks?: number;
        sharedReadBlocks?: number;
        tempReadBlocks?: number;
        tempWrittenBlocks?: number;
    };
    plans: QueryAnalysisPlanNode[];
}

export interface QueryAnalysisTableStats {
    schemaName: string;
    tableName: string;
    estimatedRows: number;
}

export interface QueryAnalysisAiSummary {
    summary: string;
    suggestions: string[];
    disclaimer: string;
}

export interface QueryAnalysisResult {
    success: true;
    mode: QueryAnalysisMode;
    normalizedSql: string;
    referencedTables: string[];
    indexes: QueryAnalysisIndexMetadata[];
    tableStats: QueryAnalysisTableStats[];
    safetyNotes: string[];
    aiSummary: QueryAnalysisAiSummary | null;
    findings: QueryAnalysisFinding[];
    rawPlan: QueryAnalysisPlanNode;
}

export interface AnalyzeQueryParams {
    query: string;
    mode?: QueryAnalysisMode;
    includeAiSummary?: boolean;
}
