export type QueryAnalysisMode = 'explain' | 'explain_analyze';
export type QueryAnalysisEvidenceSource = 'plan' | 'metadata' | 'sql_shape';
import type { QueryAnalysisAiSummary } from './queryAnalysisSummaryTypes';
export interface QueryAnalysisPlanBuffers {
    sharedHitBlocks?: number;
    sharedReadBlocks?: number;
    tempReadBlocks?: number;
    tempWrittenBlocks?: number;
}

export interface QueryAnalysisIndexMetadata {
    schemaName: string;
    tableName: string;
    indexName: string;
    accessMethod: string;
    isPrimary: boolean;
    isUnique: boolean;
    columns: string[];
    normalizedColumns: string[];
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
    buffers?: QueryAnalysisPlanBuffers;
    plans: QueryAnalysisPlanNode[];
}

export interface QueryAnalysisFinding {
    severity: 'low' | 'medium' | 'high';
    category: 'query_shape' | 'index' | 'scan' | 'join' | 'sort';
    reasonableness?: 'high_priority' | 'worth_investigating' | 'likely_reasonable';
    reasonablenessExplanation?: string;
    title: string;
    evidence: string[];
    evidenceSources: QueryAnalysisEvidenceSource[];
    sqlReferences?: string[];
    focusNodeId?: string;
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
export interface QueryAnalysisPredicate { table?: string; column?: string; operator: string; usesFunction: boolean; hasLeadingWildcard: boolean; }
export interface QueryAnalysisJoin { leftTable?: string; leftColumn?: string; rightTable?: string; rightColumn?: string; }
export interface QueryAnalysisSort { table?: string; column?: string; direction?: 'ASC' | 'DESC'; }
export interface QueryAnalysisTableStats { schemaName: string; tableName: string; estimatedRows: number; }
export interface QueryAnalysisResult {
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
