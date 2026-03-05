import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';
import { validateDraftSqlAgainstSchemaWithRequirements } from '../safety/draftSchemaValidator';
import { normalizeQuotedSchemaTableIdentifiers } from '../safety/queryValidator';
import { resolveDeterministicDraft } from './draftQuery/deterministicDraft';
import { buildJoinGraph, buildTableCatalog, detectRequestedSchema } from './draftQuery/schemaContext';
import { buildValidationDrivenHints } from './draftQuery/validationHints';
import { buildRepairConstraints } from './draftQuery/repairConstraints';

import { ZodError } from 'zod';
import { compileSemanticPlan } from '../services/queryCompiler/compiler';
import { SemanticQueryPlan } from '../services/queryCompiler/types';

const aiProvider = getProvider();
const DETERMINISTIC_CONFIDENCE_THRESHOLD = 0.75;

export const draftQuery = async (req: Request, res: Response) => {
    const traceId = `draft-${Date.now().toString(36)}`;
    const totalLabel = `[${traceId}] draftQuery-total`;
    console.time(totalLabel);
    try {
        const { question, preferred = 'sql', constraints } = req.body;
        console.time(`[${traceId}] retrieval`);
        const relatedDocs = await retrievalService.findRelevantDocs(question, 2);
        const relatedRecipes = await retrievalService.findRelevantRecipes(question, 2);
        const schema = await retrievalService.getLatestSchema();
        console.timeEnd(`[${traceId}] retrieval`);
        const requestedSchema = detectRequestedSchema(question, schema);

        const deterministic = resolveDeterministicDraft(question, schema, requestedSchema);
        if (deterministic && deterministic.confidence >= DETERMINISTIC_CONFIDENCE_THRESHOLD) {
            const deterministicValidation = validateDraftSqlAgainstSchemaWithRequirements(deterministic.draft.sql, schema, requestedSchema);
            if (deterministicValidation.valid) return res.json(deterministic.draft);
        }

        const joinGraph = buildJoinGraph(schema, requestedSchema);
        const context = {
            schema,
            joinGraph,
            tableCatalog: buildTableCatalog(schema, requestedSchema),
            glossary: relatedDocs,
            similarExamples: relatedRecipes,
            preferredMode: preferred,
            constraints,
            requiredSchema: requestedSchema,
            deterministicCandidate: deterministic ? {
                confidence: deterministic.confidence,
                reasons: deterministic.reasons,
                sql: deterministic.draft.sql
            } : undefined
        };

        let draft: SemanticQueryPlan | null = null;
        let sql = '';
        let validation: { valid: boolean; errors: string[] } = { valid: false, errors: [] };

        for (let attempt = 0; attempt < 3 && !validation.valid; attempt += 1) {
            const hints = attempt > 0 && validation.errors.length > 0
                ? buildValidationDrivenHints(validation.errors, schema, joinGraph, requestedSchema)
                : [];

            const repairContext = {
                ...context,
                previousDraftSql: sql || undefined,
                validationIssues: validation.errors.length > 0 ? validation.errors : undefined,
                constraints: attempt > 0 ? buildRepairConstraints(constraints, validation.errors, hints, sql, attempt === 2) : constraints
            };

            try {
                console.time(`[${traceId}] llm-attempt-${attempt + 1}`);
                draft = await aiProvider.generateDraftQuery(question, repairContext);
                console.timeEnd(`[${traceId}] llm-attempt-${attempt + 1}`);

                console.time(`[${traceId}] compile-validate-${attempt + 1}`);
                if (draft.requires_raw_sql && draft.raw_sql_fallback) {
                    sql = normalizeQuotedSchemaTableIdentifiers(draft.raw_sql_fallback);
                } else {
                    sql = normalizeQuotedSchemaTableIdentifiers(compileSemanticPlan(draft));
                }

                validation = validateDraftSqlAgainstSchemaWithRequirements(sql, schema, requestedSchema);
                console.timeEnd(`[${traceId}] compile-validate-${attempt + 1}`);
            } catch (err) {
                if (err instanceof ZodError) {
                    validation = { valid: false, errors: err.issues.map(i => `Zod Schema Error at ${i.path.join('.')}: ${i.message}`) };
                } else if (err instanceof Error) {
                    validation = { valid: false, errors: [err.message] };
                } else {
                    validation = { valid: false, errors: ['Unknown compilation error'] };
                }
            }
        }

        if (!validation.valid || !draft) {
            return res.status(422).json({ error: 'Generated SQL failed schema validation.', issues: validation.errors, draft });
        }

        return res.json({
            intent: draft.intent,
            assumptions: draft.assumptions,
            sql: sql,
            expectedColumns: draft.select?.map((s) => s.alias || s.column) || [],
            riskFlags: draft.riskFlags || []
        });
    } catch (error: unknown) {
        return res.status(500).json({ error: getErrorMessage(error) });
    } finally {
        console.timeEnd(totalLabel);
    }
};
