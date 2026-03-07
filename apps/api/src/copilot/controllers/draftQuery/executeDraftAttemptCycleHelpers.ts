import { compileSemanticPlan } from '../../services/queryCompiler/compiler';
import { compileLogicalToSemanticPlan } from '../../services/queryCompiler/logicalPlanCompiler';
import { validateLogicalPlanSemantics } from '../../services/queryCompiler/logicalPlanValidation';
import { LogicalQueryPlan } from '../../services/queryCompiler/logicalPlanTypes';
import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { normalizeQuotedSchemaTableIdentifiers } from '../../safety/queryValidator';
import { DraftDiagnostic, DraftValidationResult, diagnosticsToMessages } from './diagnostics';
import { detectSemanticDraftIssues } from './semanticGuards';
import { optimizeSemanticPlan } from './semanticPlanOptimization';
import { buildCandidateColumnInfo } from './semanticPlanOptimizationHelpers';
import { validateSemanticPlanAgainstIntent } from './semanticPlanValidator';
import {
    buildStructuredPlanError,
    diagnosticsToValidation,
    getContextTableCatalog
} from './executeDraftAttemptsHelpers';
import { IntentSketch } from './intentSketch';

interface CompileAndValidateDraftInput {
    logicalDraft: LogicalQueryPlan;
    preferredMode: 'sql' | 'prisma';
    question: string;
    context: Record<string, unknown>;
    schema: unknown;
    joinGraph: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
    requestedSchema?: string;
    semanticIntent?: IntentSketch;
    candidateTables?: string[];
    candidateColumnsByTable?: Record<string, string[]>;
    deterministicCandidate?: { confidence: number; sql: string };
    validateSql: (sql: string, schema: unknown, requiredSchema?: string) => DraftValidationResult;
    validateDryRunSql?: (sql: string) => Promise<DraftDiagnostic[]>;
}

export async function compileAndValidateDraft(
    input: CompileAndValidateDraftInput
): Promise<{ draft: SemanticQueryPlan | null; sql: string; validation: DraftValidationResult }> {
    const logicalPlanDiagnostics = validateLogicalPlanSemantics(input.logicalDraft, input.preferredMode);

    if (logicalPlanDiagnostics.length > 0) {
        return { draft: null, sql: '', validation: diagnosticsToValidation(logicalPlanDiagnostics) };
    }

    const draft = compileLogicalToSemanticPlan(input.logicalDraft);
    const semanticPlanDiagnostics = input.semanticIntent
        ? validateSemanticPlanAgainstIntent(draft, input.semanticIntent, {
            candidateTables: input.candidateTables || [],
            candidateColumnsByTable: input.candidateColumnsByTable,
            allowedJoinGraph: input.joinGraph
        })
        : [];

    if (semanticPlanDiagnostics.length > 0) {
        return { draft: null, sql: '', validation: diagnosticsToValidation(semanticPlanDiagnostics) };
    }

    const optimizedDraft = optimizeDraftPlan(draft, input.semanticIntent, input.joinGraph, input.context, input.candidateColumnsByTable);
    const sql = optimizedDraft.requires_raw_sql && optimizedDraft.raw_sql_fallback
        ? normalizeQuotedSchemaTableIdentifiers(optimizedDraft.raw_sql_fallback)
        : normalizeQuotedSchemaTableIdentifiers(compileSemanticPlan(optimizedDraft));
    const semanticIssues = detectSemanticDraftIssues(input.question, sql, input.deterministicCandidate);

    if (semanticIssues.length > 0) {
        return { draft: optimizedDraft, sql, validation: diagnosticsToValidation(semanticIssues) };
    }

    const schemaValidation = input.validateSql(sql, input.schema, input.requestedSchema);

    if (!schemaValidation.valid || !input.validateDryRunSql) {
        return { draft: optimizedDraft, sql, validation: schemaValidation };
    }

    const dryRunDiagnostics = await input.validateDryRunSql(sql);

    if (dryRunDiagnostics.length === 0) {
        return { draft, sql, validation: schemaValidation };
    }

        return {
        draft: optimizedDraft,
        sql,
        validation: {
            valid: false,
            errors: diagnosticsToMessages(dryRunDiagnostics),
            diagnostics: dryRunDiagnostics
        }
    };
}

function optimizeDraftPlan(
    draft: SemanticQueryPlan,
    semanticIntent: IntentSketch | undefined,
    joinGraph: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[],
    context: Record<string, unknown>,
    candidateColumnsByTable?: Record<string, string[]>
) {
    if (draft.requires_raw_sql) throw buildStructuredPlanError();
    const candidateColumnInfo = candidateColumnsByTable
        ? { columnsByTable: candidateColumnsByTable }
        : buildCandidateColumnInfo(getContextTableCatalog(context));

    return optimizeSemanticPlan(draft, semanticIntent, joinGraph, candidateColumnInfo);
}
