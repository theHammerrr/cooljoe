import { executeDraftAttempts } from '../controllers/draftQuery/executeDraftAttempts';
import { DraftJobStage } from '../domain/draftQuery';
import { buildDraftContext, DraftTargetMode } from '../controllers/draftQuery/buildDraftContext';
import { RankedDraftContext } from '../controllers/draftQuery/candidateScope';
import { IntentSketch } from '../controllers/draftQuery/intentSketch';
import { JoinGraphEdge, TableCatalogRow } from '../controllers/draftQuery/models';
import { validateDraftSqlAgainstSchemaWithRequirements } from '../safety/draftSchemaValidator';
import { buildDryRunValidator } from './draftQueryApplicationServiceHelpers';
import { LogicalQueryPlan } from '../services/queryCompiler/logicalPlanTypes';

interface ExecuteDraftPlanningInput {
    aiProvider: { generateDraftQuery: (question: string, context: Record<string, unknown>) => Promise<LogicalQueryPlan> };
    traceId: string;
    requestId: string;
    question: string;
    constraints: unknown;
    schema: unknown;
    joinGraph: JoinGraphEdge[];
    tableCatalog: TableCatalogRow[];
    requestedSchema?: string;
    intentSketch: IntentSketch;
    rankedDraftContext?: RankedDraftContext | null;
    relatedDocs: unknown;
    relatedRecipes: unknown;
    preferredMode: DraftTargetMode;
    deterministic?: { confidence: number; reasons?: string[]; draft: { sql: string } } | null;
    onStage: (stage: DraftJobStage, attempt?: number, detail?: string) => void;
    onAttempt: (attempt: number, sql: string, valid: boolean, errors: string[]) => Promise<void>;
    throwIfStopped: (checkpoint: string) => Promise<void>;
}

export async function executeDraftPlanning(input: ExecuteDraftPlanningInput) {
    const planningSchema = input.rankedDraftContext?.schema || input.schema;
    const planningJoinGraph = input.rankedDraftContext?.joinGraph || input.joinGraph;
    const planningTableCatalog = input.rankedDraftContext?.tableCatalog.length ? input.rankedDraftContext.tableCatalog : input.tableCatalog;
    const context = buildDraftContext({
        schema: planningSchema,
        joinGraph: planningJoinGraph,
        tableCatalog: planningTableCatalog,
        fullTableCatalog: input.tableCatalog,
        glossary: input.relatedDocs,
        similarExamples: input.relatedRecipes,
        preferredMode: input.preferredMode,
        constraints: input.constraints,
        requiredSchema: input.requestedSchema,
        semanticIntent: input.intentSketch,
        candidateTables: input.rankedDraftContext?.focusTables || input.tableCatalog.map((row) => row.table),
        rankedCandidates: input.rankedDraftContext?.rankedTables,
        candidateColumnsByTable: input.rankedDraftContext?.candidateColumnsByTable,
        preferredJoinPaths: input.rankedDraftContext?.preferredJoinPaths,
        deterministicCandidate: input.deterministic ? {
            confidence: input.deterministic.confidence,
            reasons: input.deterministic.reasons || [],
            sql: input.deterministic.draft.sql
        } : undefined
    });

    return executeDraftAttempts({
        traceId: input.traceId,
        question: input.question,
        constraints: input.constraints,
        context,
        schema: input.schema,
        joinGraph: input.joinGraph,
        requestedSchema: input.requestedSchema,
        semanticIntent: input.intentSketch,
        candidateTables: input.rankedDraftContext?.focusTables || input.tableCatalog.map((row) => row.table),
        candidateColumnsByTable: input.rankedDraftContext?.candidateColumnsByTable,
        preferredMode: input.preferredMode,
        deterministicCandidate: input.deterministic ? { confidence: input.deterministic.confidence, sql: input.deterministic.draft.sql } : undefined,
        generateDraftQuery: (question, context) => input.aiProvider.generateDraftQuery(question, context),
        validateSql: (candidateSql, currentSchema, required) =>
            validateDraftSqlAgainstSchemaWithRequirements(candidateSql, currentSchema, required),
        validateDryRunSql: buildDryRunValidator(),
        onStage: input.onStage,
        onAttempt: input.onAttempt,
        throwIfStopped: input.throwIfStopped
    });
}
