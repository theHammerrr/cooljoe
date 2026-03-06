import { ZodError } from 'zod';
import { buildRepairConstraints } from './repairConstraints';
import { buildValidationDrivenHints } from './validationHints';
import { detectSemanticDraftIssue } from './semanticGuards';
import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { compileSemanticPlan } from '../../services/queryCompiler/compiler';
import { normalizeQuotedSchemaTableIdentifiers } from '../../safety/queryValidator';
import { DraftJobStage } from '../../domain/draftQuery';

interface ExecuteDraftAttemptsInput {
    traceId: string;
    question: string;
    constraints: unknown;
    context: Record<string, unknown>;
    schema: unknown;
    joinGraph: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
    requestedSchema?: string;
    deterministicCandidate?: { confidence: number; sql: string };
    generateDraftQuery: (question: string, context: Record<string, unknown>) => Promise<SemanticQueryPlan>;
    validateSql: (sql: string, schema: unknown, requiredSchema?: string) => { valid: boolean; errors: string[] };
    onStage?: (stage: DraftJobStage, attempt?: number, detail?: string) => void;
    onAttempt?: (attempt: number, sql: string, valid: boolean, errors: string[]) => void | Promise<void>;
}

export async function executeDraftAttempts(input: ExecuteDraftAttemptsInput): Promise<{
    draft: SemanticQueryPlan | null;
    sql: string;
    validation: { valid: boolean; errors: string[] };
}> {
    let draft: SemanticQueryPlan | null = null;
    let sql = '';
    let validation: { valid: boolean; errors: string[] } = { valid: false, errors: [] };

    for (let attempt = 0; attempt < 3 && !validation.valid; attempt += 1) {
        input.onStage?.('planning_with_llm', attempt + 1);
        const hints = attempt > 0 && validation.errors.length > 0
            ? buildValidationDrivenHints(validation.errors, input.schema, input.joinGraph, input.requestedSchema)
            : [];

        if (attempt > 0) {
            const retryReason = validation.errors.join(' | ');
            input.onStage?.('retrying_with_stricter_context', attempt + 1, retryReason);
            console.warn(`[${input.traceId}] retrying generation (attempt ${attempt + 1}) due to: ${retryReason} | failed-sql: ${sql}`);
        }

        const repairContext = {
            ...input.context,
            previousDraftSql: sql || undefined,
            validationIssues: validation.errors.length > 0 ? validation.errors : undefined,
            constraints: attempt > 0 ? buildRepairConstraints(input.constraints, validation.errors, hints, sql, attempt === 2) : input.constraints,
            ...(attempt > 0 && input.schema ? { fullSchemaContext: input.schema } : {})
        };

        try {
            console.time(`[${input.traceId}] llm-attempt-${attempt + 1}`);
            draft = await input.generateDraftQuery(input.question, repairContext);
            console.timeEnd(`[${input.traceId}] llm-attempt-${attempt + 1}`);
            console.log(`[${input.traceId}] llm-draft-attempt-${attempt + 1}:`, draft);

            console.time(`[${input.traceId}] compile-validate-${attempt + 1}`);

            try {
                input.onStage?.('compiling_and_validating', attempt + 1);

                if (draft.requires_raw_sql && draft.raw_sql_fallback) {
                    sql = normalizeQuotedSchemaTableIdentifiers(draft.raw_sql_fallback);
                } else {
                    if (draft.requires_raw_sql) throw new Error('Structured plan is required when raw SQL fallback is not provided.');
                    sql = normalizeQuotedSchemaTableIdentifiers(compileSemanticPlan(draft));
                }

                const semanticIssue = detectSemanticDraftIssue(input.question, sql, input.deterministicCandidate);

                if (semanticIssue) {
                    validation = { valid: false, errors: [semanticIssue] };

                    if (attempt < 2) console.warn(`[${input.traceId}] scheduling retry after attempt ${attempt + 1}; semantic issue: ${semanticIssue}`);
                    continue;
                }

                validation = input.validateSql(sql, input.schema, input.requestedSchema);
                await input.onAttempt?.(attempt + 1, sql, validation.valid, validation.errors);
            } finally {
                console.timeEnd(`[${input.traceId}] compile-validate-${attempt + 1}`);
            }

            if (!validation.valid && attempt < 2) console.warn(`[${input.traceId}] scheduling retry after attempt ${attempt + 1}; validation issues: ${validation.errors.join(' | ')}`);
        } catch (err) {
            if (err instanceof ZodError) validation = { valid: false, errors: err.issues.map((issue) => `Zod Schema Error at ${issue.path.join('.')}: ${issue.message}`) };
            else if (err instanceof Error) validation = { valid: false, errors: [err.message] };
            else validation = { valid: false, errors: ['Unknown compilation error'] };
            await input.onAttempt?.(attempt + 1, sql, false, validation.errors);

            if (attempt < 2) console.warn(`[${input.traceId}] scheduling retry after attempt ${attempt + 1}; runtime issues: ${validation.errors.join(' | ')}`);
        }
    }

    return { draft, sql, validation };
}
