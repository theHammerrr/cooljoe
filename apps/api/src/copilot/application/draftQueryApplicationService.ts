import { retrievalService } from '../services/retrievalService';
import { getProvider } from '../services/llm/providerFactory';
import { validateDraftSqlAgainstSchemaWithRequirements } from '../safety/draftSchemaValidator';
import { resolveDeterministicDraft } from '../controllers/draftQuery/deterministicDraft';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from '../controllers/draftQuery/schemaContext';
import { buildApiDraftPayload, buildDraftContext, DraftTargetMode } from '../controllers/draftQuery/buildDraftContext';
import { executeDraftAttempts } from '../controllers/draftQuery/executeDraftAttempts';
import { finishDraftStage, startDraftStage, updateDraftStage } from '../controllers/draftQuery/stageTracker';
import { getErrorMessage } from '../utils/errorUtils';
import { DraftQueryCommand } from '../domain/draftQuery';
import { draftJobStore } from './DraftJobStore';

const aiProvider = getProvider();
const DETERMINISTIC_CONFIDENCE_THRESHOLD = 0.75;

export interface DraftQueryApplicationResult {
    status: number;
    payload: Record<string, unknown>;
}

class DraftQueryApplicationService {
    async runDraftJob(command: DraftQueryCommand, requestId: string, traceId: string): Promise<DraftQueryApplicationResult> {
        startDraftStage(requestId, 'fetching_context');

        try {
            const { question, preferred, constraints } = command;
            const preferredMode: DraftTargetMode = preferred === 'prisma' ? 'prisma' : 'sql';
            await draftJobStore.createJob({ requestId, question, preferredMode, constraints });
            console.time(`[${traceId}] retrieval`);
            const [relatedDocs, relatedRecipes, schema] = await Promise.all([
                retrievalService.findRelevantDocs(question, 2),
                retrievalService.findRelevantRecipes(question, 2),
                retrievalService.getLatestSchema()
            ]);
            console.timeEnd(`[${traceId}] retrieval`);
            updateDraftStage(requestId, 'building_context');

            const requestedSchema = detectRequestedSchema(question, schema);
            const deterministic = resolveDeterministicDraft(question, schema, requestedSchema);

            if (deterministic && deterministic.confidence >= DETERMINISTIC_CONFIDENCE_THRESHOLD) {
                const valid = validateDraftSqlAgainstSchemaWithRequirements(deterministic.draft.sql, schema, requestedSchema);

                if (valid.valid) {
                    updateDraftStage(requestId, 'finalizing_draft');
                    finishDraftStage(requestId);

                    return { status: 200, payload: { ...deterministic.draft, requestId } };
                }
            }

            const joinGraph = buildJoinGraph(schema, requestedSchema);
            const context = buildDraftContext({
                schema,
                joinGraph,
                tableCatalog: buildTableCatalog(schema, requestedSchema),
                glossary: relatedDocs,
                similarExamples: relatedRecipes,
                preferredMode,
                constraints,
                requiredSchema: requestedSchema,
                deterministicCandidate: deterministic ? {
                    confidence: deterministic.confidence,
                    reasons: deterministic.reasons,
                    sql: deterministic.draft.sql
                } : undefined
            });

            const result = await executeDraftAttempts({
                traceId,
                question,
                constraints,
                context,
                schema,
                joinGraph,
                requestedSchema,
                deterministicCandidate: deterministic ? { confidence: deterministic.confidence, sql: deterministic.draft.sql } : undefined,
                generateDraftQuery: (q, c) => aiProvider.generateDraftQuery(q, c),
                validateSql: (candidateSql, currentSchema, required) =>
                    validateDraftSqlAgainstSchemaWithRequirements(candidateSql, currentSchema, required),
                onStage: (stage, attempt, detail) => updateDraftStage(requestId, stage, attempt, detail),
                onAttempt: (attempt, attemptSql, valid, errors) =>
                    draftJobStore.recordAttempt(requestId, attempt, attemptSql, valid, errors)
            });

            if (!result.validation.valid || !result.draft) {
                finishDraftStage(requestId, result.validation.errors[0] || 'Generated SQL failed schema validation.');

                return {
                    status: 422,
                    payload: { error: 'Generated SQL failed schema validation.', issues: result.validation.errors, draft: result.draft }
                };
            }

            updateDraftStage(requestId, 'finalizing_draft');
            finishDraftStage(requestId);

            return { status: 200, payload: { ...buildApiDraftPayload(result.draft, result.sql), requestId } };
        } catch (error: unknown) {
            finishDraftStage(requestId, getErrorMessage(error));

            return { status: 500, payload: { error: getErrorMessage(error) } };
        }
    }
}

export const draftQueryApplicationService = new DraftQueryApplicationService();
