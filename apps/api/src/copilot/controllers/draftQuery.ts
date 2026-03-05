import { Request, Response } from 'express';
import { retrievalService } from '../services/retrievalService';
import { getProvider } from '../services/llm/providerFactory';
import { getErrorMessage } from '../utils/errorUtils';
import { validateDraftSqlAgainstSchemaWithRequirements } from '../safety/draftSchemaValidator';

const aiProvider = getProvider();

function detectRequestedSchema(question: string, schema: unknown): string | undefined {
    if (typeof schema !== 'object' || schema === null) {
        return undefined;
    }

    const schemaNames = new Set<string>();
    for (const key of Object.keys(schema)) {
        const firstDot = key.indexOf('.');
        if (firstDot > 0) {
            schemaNames.add(key.slice(0, firstDot).toLowerCase());
        }
    }

    const lowerQuestion = question.toLowerCase();
    for (const schemaName of schemaNames) {
        const pattern = new RegExp(`\\b${schemaName}\\b`, 'i');
        if (pattern.test(lowerQuestion)) {
            return schemaName;
        }
    }
    return undefined;
}

export const draftQuery = async (req: Request, res: Response) => {
    try {
        const { question, preferred = 'sql', constraints } = req.body;

        const relatedDocs = await retrievalService.findRelevantDocs(question, 2);
        const relatedRecipes = await retrievalService.findRelevantRecipes(question, 2);
        const schema = await retrievalService.getLatestSchema();
        const requestedSchema = detectRequestedSchema(question, schema);

        const context = {
            schema,
            glossary: relatedDocs,
            similarExamples: relatedRecipes,
            preferredMode: preferred,
            constraints,
            requiredSchema: requestedSchema
        };
        const draft = await aiProvider.generateDraftQuery(question, context);
        const validation = validateDraftSqlAgainstSchemaWithRequirements(draft.sql, schema, requestedSchema);

        if (!validation.valid) {
            return res.status(422).json({
                error: 'Generated SQL failed schema validation.',
                issues: validation.errors
            });
        }

        res.json(draft);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
