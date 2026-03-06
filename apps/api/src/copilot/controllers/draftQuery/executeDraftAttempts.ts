import { ZodError } from 'zod';
import { buildRepairConstraints } from './repairConstraints';
import { buildValidationDrivenHints } from './validationHints';
import { detectSemanticDraftIssue } from './semanticGuards';
import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { compileSemanticPlan } from '../../services/queryCompiler/compiler';
import { normalizeQuotedSchemaTableIdentifiers } from '../../safety/queryValidator';

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
        const hints = attempt > 0 && validation.errors.length > 0
            ? buildValidationDrivenHints(validation.errors, input.schema, input.joinGraph, input.requestedSchema)
            : [];
        if (attempt > 0) console.warn(`[${input.traceId}] retrying generation (attempt ${attempt + 1}) due to: ${validation.errors.join(' | ')} | failed-sql: ${sql}`);

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
            console.timeEnd(`[${input.traceId}] compile-validate-${attempt + 1}`);
            if (!validation.valid && attempt < 2) console.warn(`[${input.traceId}] scheduling retry after attempt ${attempt + 1}; validation issues: ${validation.errors.join(' | ')}`);
        } catch (err) {
            if (err instanceof ZodError) validation = { valid: false, errors: err.issues.map((issue) => `Zod Schema Error at ${issue.path.join('.')}: ${issue.message}`) };
            else if (err instanceof Error) validation = { valid: false, errors: [err.message] };
            else validation = { valid: false, errors: ['Unknown compilation error'] };
            if (attempt < 2) console.warn(`[${input.traceId}] scheduling retry after attempt ${attempt + 1}; runtime issues: ${validation.errors.join(' | ')}`);
        }
    }

    return { draft, sql, validation };
}
