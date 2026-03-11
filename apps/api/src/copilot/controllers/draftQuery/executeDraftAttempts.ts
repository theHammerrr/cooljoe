import { DraftDiagnostic, DraftValidationResult } from './diagnostics';
import { LogicalQueryPlan } from '../../services/queryCompiler/logicalPlanTypes';
import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { DraftJobStage } from '../../domain/draftQuery';
import { DraftTargetMode } from './buildDraftContext';
import { IntentSketch } from './intentSketch';
import {
    buildRepairContext,
} from './executeDraftAttemptsHelpers';
import { executeDraftAttemptCycle } from './executeDraftAttemptCycle';

interface ExecuteDraftAttemptsInput {
    traceId: string;
    question: string;
    constraints: unknown;
    context: Record<string, unknown>;
    schema: unknown;
    joinGraph: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
    requestedSchema?: string;
    semanticIntent?: IntentSketch;
    candidateTables?: string[];
    candidateColumnsByTable?: Record<string, string[]>;
    preferredMode: DraftTargetMode;
    deterministicCandidate?: { confidence: number; sql: string };
    generateDraftQuery: (question: string, context: Record<string, unknown>) => Promise<LogicalQueryPlan>;
    validateSql: (sql: string, schema: unknown, requiredSchema?: string) => DraftValidationResult;
    validateDryRunSql?: (sql: string) => Promise<DraftDiagnostic[]>;
    onStage?: (stage: DraftJobStage, attempt?: number, detail?: string) => void;
    onAttempt?: (attempt: number, sql: string, valid: boolean, errors: string[]) => void | Promise<void>;
    throwIfStopped?: (checkpoint: string) => Promise<void> | void;
}

export async function executeDraftAttempts(input: ExecuteDraftAttemptsInput): Promise<{
    draft: SemanticQueryPlan | null;
    sql: string;
    validation: DraftValidationResult;
}> {
    let draft: SemanticQueryPlan | null = null;
    let sql = '';
    let validation: DraftValidationResult = { valid: false, errors: [], diagnostics: [] };

    for (let attempt = 0; attempt < 3 && !validation.valid; attempt += 1) {
        await input.throwIfStopped?.(`llm attempt ${attempt + 1}`);
        input.onStage?.('planning_with_llm', attempt + 1);

        if (attempt > 0) {
            const retryReason = validation.diagnostics.map((diagnostic) => diagnostic.code).join(' | ') || validation.errors.join(' | ');
            input.onStage?.('retrying_with_stricter_context', attempt + 1, retryReason);
            console.warn(`[${input.traceId}] retrying generation (attempt ${attempt + 1}) due to: ${retryReason} | failed-sql: ${sql}`);
        }

        const repair = buildRepairContext({
            attempt,
            context: input.context,
            constraints: input.constraints,
            validation,
            schema: input.schema,
            joinGraph: input.joinGraph,
            requestedSchema: input.requestedSchema,
            sql
        });

        const cycle = await executeDraftAttemptCycle({
            ...input,
            attempt: attempt + 1,
            context: repair.context
        });

        draft = cycle.draft;
        sql = cycle.sql;
        validation = cycle.validation;

        if (!validation.valid && attempt < 2) {
            const failureReason = validation.diagnostics.map((diagnostic) => diagnostic.code).join(' | ') || validation.errors.join(' | ');
            console.warn(`[${input.traceId}] scheduling retry after attempt ${attempt + 1}; issues: ${failureReason}`);
        }
    }

    return { draft, sql, validation };
}
