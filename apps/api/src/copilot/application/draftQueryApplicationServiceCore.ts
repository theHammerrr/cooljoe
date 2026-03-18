import { resolveDeterministicDraft } from '../controllers/draftQuery/deterministicDraft';
import { startDraftStage, updateDraftStage } from '../controllers/draftQuery/stageTracker';
import { validateDraftSqlAgainstSchemaWithRequirements } from '../safety/draftSchemaValidator';
import { DraftQueryCommand } from '../domain/draftQuery';
import { AIProvider } from '../services/llm/AIProvider';
import { DraftQueryApplicationResult } from './draftQueryApplicationService';
import { draftJobStore } from './DraftJobStore';
import { executeDraftPlanning } from './draftQueryApplicationServiceExecution';
import { loadDraftPlanningInputs, loadDraftRetrieval } from './draftQueryApplicationServiceHelpers';
import {
    persistClarificationResult,
    persistInvalidDraftResult,
    persistSuccessfulDraftResult,
    buildCompletedDraftPayload
} from './draftQueryApplicationServiceResult';

const DETERMINISTIC_CONFIDENCE_THRESHOLD = 0.75;

interface DraftJobCoreInput {
    aiProvider: Pick<AIProvider, 'generateDraftQuery'>;
    command: DraftQueryCommand;
    requestId: string;
    traceId: string;
    preferredMode: 'sql' | 'prisma';
    executionControl: { throwIfStopped: (checkpoint: string) => Promise<void> };
}

export async function runDraftJobCore(input: DraftJobCoreInput): Promise<DraftQueryApplicationResult> {
    const { question, constraints } = input.command;
    await draftJobStore.createJob({ requestId: input.requestId, question, preferredMode: input.preferredMode, constraints });
    const markedRunning = await draftJobStore.markRunning(input.requestId);

    if (!markedRunning && await draftJobStore.isCancelled(input.requestId)) {
        return { status: 409, payload: { error: 'Draft job cancelled by client.' } };
    }

    await input.executionControl.throwIfStopped('schema load');
    startDraftStage(input.requestId, 'fetching_context');
    const planningInputs = await loadDraftPlanningInputs(question, input.traceId);
    await input.executionControl.throwIfStopped('deterministic resolution');

    if (planningInputs.needsClarification) {
        return persistClarificationResult(input.requestId, {
            type: 'clarification_required',
            message: planningInputs.intentSketch.clarificationQuestion || 'I need more detail before I can draft a safe query.',
            missing: planningInputs.intentSketch.missing,
            intentSketch: planningInputs.intentSketch
        });
    }

    const deterministic = resolveDeterministicDraft(question, planningInputs.schema, planningInputs.requestedSchema);

    if (deterministic && deterministic.confidence >= DETERMINISTIC_CONFIDENCE_THRESHOLD) {
        const valid = validateDraftSqlAgainstSchemaWithRequirements(deterministic.draft.sql, planningInputs.schema, planningInputs.requestedSchema);

        if (valid.valid) {
            return persistSuccessfulDraftResult(input.requestId, { ...deterministic.draft, requestId: input.requestId });
        }
    }

    await input.executionControl.throwIfStopped('retrieval');
    const retrieval = await loadDraftRetrieval(question, input.traceId, {
        ...planningInputs.knowledgeScope,
        tables: planningInputs.rankedDraftContext?.focusTables || planningInputs.knowledgeScope.tables
    });
    updateDraftStage(input.requestId, 'building_context');
    await input.executionControl.throwIfStopped('context build');
    const result = await executeDraftPlanning({
        aiProvider: input.aiProvider,
        traceId: input.traceId,
        requestId: input.requestId,
        question,
        constraints,
        schema: planningInputs.schema,
        joinGraph: planningInputs.joinGraph,
        tableCatalog: planningInputs.tableCatalog,
        requestedSchema: planningInputs.requestedSchema,
        intentSketch: planningInputs.intentSketch,
        rankedDraftContext: planningInputs.rankedDraftContext,
        relatedDocs: retrieval.relatedDocs,
        relatedRecipes: retrieval.relatedRecipes,
        preferredMode: input.preferredMode,
        deterministic,
        onStage: (stage, attempt, detail) => updateDraftStage(input.requestId, stage, attempt, detail),
        onAttempt: (attempt, attemptSql, valid, errors) => draftJobStore.recordAttempt(input.requestId, attempt, attemptSql, valid, errors),
        throwIfStopped: (checkpoint) => input.executionControl.throwIfStopped(checkpoint)
    });

    if (!result.validation.valid || !result.draft) {
        return persistInvalidDraftResult(
            input.requestId,
            {
                error: 'Generated SQL failed schema validation.',
                issues: result.validation.errors,
                diagnostics: result.validation.diagnostics,
                draft: result.draft ? buildCompletedDraftPayload(input.requestId, result.draft, result.sql) : undefined
            },
            result.validation.errors[0] || 'Generated SQL failed schema validation.'
        );
    }

    await input.executionControl.throwIfStopped('final result persistence');

    return persistSuccessfulDraftResult(input.requestId, buildCompletedDraftPayload(input.requestId, result.draft, result.sql));
}
