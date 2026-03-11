import { DraftJobStage } from '../../domain/draftQuery';
import { LogicalQueryPlan } from '../../services/queryCompiler/logicalPlanTypes';
import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { DraftDiagnostic, DraftValidationResult } from './diagnostics';
import { DraftTargetMode } from './buildDraftContext';
import { IntentSketch } from './intentSketch';
import { compileAndValidateDraft } from './executeDraftAttemptCycleHelpers';
import { toAttemptFailureValidation } from './executeDraftAttemptFailureValidation';

interface ExecuteDraftAttemptCycleInput {
    attempt: number;
    traceId: string;
    question: string;
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

export async function executeDraftAttemptCycle(input: ExecuteDraftAttemptCycleInput): Promise<{
    draft: SemanticQueryPlan | null;
    logicalDraft: LogicalQueryPlan | null;
    sql: string;
    validation: DraftValidationResult;
}> {
    let draft: SemanticQueryPlan | null = null;
    let logicalDraft: LogicalQueryPlan | null = null;
    let sql = '';
    let validation: DraftValidationResult = { valid: false, errors: [], diagnostics: [] };

    try {
        await input.throwIfStopped?.(`llm attempt ${input.attempt}`);
        console.time(`[${input.traceId}] llm-attempt-${input.attempt}`);
        logicalDraft = await input.generateDraftQuery(input.question, input.context);
        console.timeEnd(`[${input.traceId}] llm-attempt-${input.attempt}`);
        console.log(`[${input.traceId}] llm-draft-attempt-${input.attempt}:`, logicalDraft);
        console.time(`[${input.traceId}] compile-validate-${input.attempt}`);

        try {
            await input.throwIfStopped?.(`compile and validate attempt ${input.attempt}`);
            input.onStage?.('compiling_and_validating', input.attempt);
            const compileResult = await compileAndValidateDraft({ ...input, logicalDraft });

            draft = compileResult.draft;
            sql = compileResult.sql;
            validation = compileResult.validation;
        } finally {
            console.timeEnd(`[${input.traceId}] compile-validate-${input.attempt}`);
        }
    } catch (err) {
        validation = toAttemptFailureValidation(err);
    }

    await input.onAttempt?.(input.attempt, sql, validation.valid, validation.errors);

    return { draft, logicalDraft, sql, validation };
}
