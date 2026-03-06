import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { compilePrismaPlan } from '../../services/queryCompiler/prismaCompiler';
import { JoinGraphEdge, TableCatalogRow } from './models';

export type DraftTargetMode = 'sql' | 'prisma';

interface DeterministicCandidate {
    confidence: number;
    reasons: string[];
    sql: string;
}

interface BuildDraftContextInput {
    schema: unknown;
    joinGraph: JoinGraphEdge[];
    tableCatalog: TableCatalogRow[];
    glossary: unknown;
    similarExamples: unknown;
    preferredMode: DraftTargetMode;
    constraints: unknown;
    requiredSchema?: string;
    deterministicCandidate?: DeterministicCandidate;
    previousDraftSql?: string;
    validationIssues?: string[];
}

export function buildDraftContext(input: BuildDraftContextInput): Record<string, unknown> {
    return {
        joinGraph: input.joinGraph,
        tableCatalog: input.tableCatalog,
        glossary: input.glossary,
        similarExamples: input.similarExamples,
        preferredMode: input.preferredMode,
        constraints: input.constraints,
        requiredSchema: input.requiredSchema,
        deterministicCandidate: input.deterministicCandidate,
        previousDraftSql: input.previousDraftSql,
        validationIssues: input.validationIssues
    };
}

export function buildApiDraftPayload(draft: SemanticQueryPlan, sql: string) {
    let prismaStr = '';
    try {
        if (!draft.requires_raw_sql) {
            prismaStr = compilePrismaPlan(draft);
        }
    } catch (err) {
        console.warn('Failed to compile prisma fallback string:', err);
    }

    return {
        intent: draft.intent,
        assumptions: draft.assumptions,
        sql,
        prisma: prismaStr,
        expectedColumns: draft.select?.map((s) => s.alias || s.column) || [],
        riskFlags: draft.riskFlags || []
    };
}
