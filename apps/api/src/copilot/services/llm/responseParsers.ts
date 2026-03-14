import { LogicalQueryPlan, LogicalQueryPlanSchema } from '../queryCompiler/logicalPlanTypes';
import { SemanticQueryPlan, SemanticQueryPlanSchema } from '../queryCompiler/types';
import { looksLikeLegacySemanticPlan, normalizeDraftPlanShape } from './draftPlanNormalization';
import { semanticToLogicalPlan } from './logicalPlanAdapters';

interface ExplanationResponse {
    explanation: string;
    followUps: string[];
}

interface QueryAnalysisSummaryResponse {
    summary: string;
    suggestions: string[];
}

function tryParseLogicalPlan(normalizedPlan: unknown): LogicalQueryPlan | null {
    try {
        return LogicalQueryPlanSchema.parse(normalizedPlan);
    } catch {
        return null;
    }
}

function tryParseSemanticPlan(normalizedPlan: unknown): SemanticQueryPlan | null {
    try {
        return SemanticQueryPlanSchema.parse(normalizedPlan);
    } catch {
        return null;
    }
}

export function parseDraftResponse(content: string | null | undefined): LogicalQueryPlan {
    let parsedJson = {};

    try {
        parsedJson = JSON.parse(content || '{}');
    } catch {
        // Fallback to extraction if LLM wrapped in markdown blocks
        const match = content?.match(/```(?:json)?([\s\S]*?)```/);

        if (match) {
            parsedJson = JSON.parse(match[1]);
        }
    }

    const normalizedPlan = normalizeDraftPlanShape(parsedJson);
    const isLegacySemanticPlan = looksLikeLegacySemanticPlan(normalizedPlan);

    if (!isLegacySemanticPlan) {
        const logicalPlan = tryParseLogicalPlan(normalizedPlan);

        if (logicalPlan) return logicalPlan;
    }

    const semanticPlan = tryParseSemanticPlan(normalizedPlan);

    if (semanticPlan) return semanticToLogicalPlan(semanticPlan);

    return LogicalQueryPlanSchema.parse(normalizedPlan);
}

export function parseExplanationResponse(content: string | null | undefined): ExplanationResponse {
    const parsed = JSON.parse(content || '{}');

    return {
        explanation: parsed.explanation || '',
        followUps: parsed.followUps || []
    };
}

export function parseQueryAnalysisSummaryResponse(content: string | null | undefined): QueryAnalysisSummaryResponse {
    const parsed = JSON.parse(content || '{}');

    return {
        summary: parsed.summary || '',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((value: unknown): value is string => typeof value === 'string') : []
    };
}
