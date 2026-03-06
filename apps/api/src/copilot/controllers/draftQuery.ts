import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';
import { validateDraftSqlAgainstSchemaWithRequirements } from '../safety/draftSchemaValidator';
import { resolveDeterministicDraft } from './draftQuery/deterministicDraft';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from './draftQuery/schemaContext';
import { buildApiDraftPayload, buildDraftContext, DraftTargetMode } from './draftQuery/buildDraftContext';
import { executeDraftAttempts } from './draftQuery/executeDraftAttempts';

const aiProvider = getProvider();
const DETERMINISTIC_CONFIDENCE_THRESHOLD = 0.75;

export const draftQuery = async (req: Request, res: Response) => {
    const traceId = `draft-${Date.now().toString(36)}`;
    console.time(`[${traceId}] draftQuery-total`);
    try {
        const { question, preferred, constraints } = req.body;
        const preferredMode: DraftTargetMode = preferred === 'prisma' ? 'prisma' : 'sql';
        console.time(`[${traceId}] retrieval`);
        const [relatedDocs, relatedRecipes, schema] = await Promise.all([
            retrievalService.findRelevantDocs(question, 2),
            retrievalService.findRelevantRecipes(question, 2),
            retrievalService.getLatestSchema()
        ]);
        console.timeEnd(`[${traceId}] retrieval`);

        const requestedSchema = detectRequestedSchema(question, schema);
        const deterministic = resolveDeterministicDraft(question, schema, requestedSchema);
        if (deterministic && deterministic.confidence >= DETERMINISTIC_CONFIDENCE_THRESHOLD) {
            const valid = validateDraftSqlAgainstSchemaWithRequirements(deterministic.draft.sql, schema, requestedSchema);
            if (valid.valid) return res.json(deterministic.draft);
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
                validateDraftSqlAgainstSchemaWithRequirements(candidateSql, currentSchema, required)
        });

        if (!result.validation.valid || !result.draft) {
            return res.status(422).json({ error: 'Generated SQL failed schema validation.', issues: result.validation.errors, draft: result.draft });
        }

        return res.json(buildApiDraftPayload(result.draft, result.sql));
    } catch (error: unknown) {
        return res.status(500).json({ error: getErrorMessage(error) });
    } finally {
        console.timeEnd(`[${traceId}] draftQuery-total`);
    }
};
