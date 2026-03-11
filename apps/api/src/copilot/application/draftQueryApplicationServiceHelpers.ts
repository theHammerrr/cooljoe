import { retrievalService } from '../services/retrievalService';
import { DraftDiagnostic } from '../controllers/draftQuery/diagnostics';
import { getErrorMessage } from '../utils/errorUtils';
import { buildRankedDraftContext } from '../controllers/draftQuery/candidateScope';
import { buildIntentSketch, requiresClarification } from '../controllers/draftQuery/intentSketch';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from '../controllers/draftQuery/schemaContext';
import { explainTargetQuery } from '../services/executionService';

export async function loadDraftPlanningInputs(question: string, traceId: string) {
    console.time(`[${traceId}] schema-load`);
    const schema = await retrievalService.getLatestSchema();
    console.timeEnd(`[${traceId}] schema-load`);
    const requestedSchema = detectRequestedSchema(question, schema);
    const joinGraph = buildJoinGraph(schema, requestedSchema);
    const tableCatalog = buildTableCatalog(schema, requestedSchema);
    const intentSketch = buildIntentSketch(question, tableCatalog);

    return {
        schema,
        requestedSchema,
        joinGraph,
        tableCatalog,
        intentSketch,
        needsClarification: requiresClarification(intentSketch),
        rankedDraftContext: buildRankedDraftContext(schema, joinGraph, tableCatalog, intentSketch)
    };
}

export async function loadDraftRetrieval(question: string, traceId: string) {
    console.time(`[${traceId}] retrieval`);
    const [relatedDocs, relatedRecipes] = await Promise.all([
        retrievalService.findRelevantDocs(question, 2),
        retrievalService.findRelevantRecipes(question, 2)
    ]);
    console.timeEnd(`[${traceId}] retrieval`);

    return { relatedDocs, relatedRecipes };
}

export function buildDryRunValidator() {
    return async (candidateSql: string): Promise<DraftDiagnostic[]> => {
        try {
            const result = await explainTargetQuery(candidateSql);

            if (result.skipped) return [];

            return [];
        } catch (error: unknown) {
            const diagnostic: DraftDiagnostic = {
                code: 'DATABASE_DRY_RUN_FAILED',
                message: `Draft SQL failed database dry-run validation: ${getErrorMessage(error)}`
            };

            return [diagnostic];
        }
    };
}
