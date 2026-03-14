export type QueryAnalysisMode = 'explain';

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

export interface QueryAnalysisFinding {
    severity: 'low' | 'medium' | 'high';
    category: 'query_shape' | 'index' | 'scan' | 'join' | 'sort';
    title: string;
    evidence: string[];
    suggestion: string;
    confidence: 'high' | 'medium';
    isHeuristic: boolean;
}

export interface QueryAnalysisPredicate {
    table?: string;
    column?: string;
    operator: string;
    usesFunction: boolean;
    hasLeadingWildcard: boolean;
}

export interface QueryAnalysisJoin {
    leftTable?: string;
    leftColumn?: string;
    rightTable?: string;
    rightColumn?: string;
}

export interface QueryAnalysisResult {
    mode: QueryAnalysisMode;
    normalizedSql: string;
    referencedTables: string[];
    indexes: QueryAnalysisIndexMetadata[];
    findings: QueryAnalysisFinding[];
    rawPlan: QueryAnalysisPlanNode;
}
