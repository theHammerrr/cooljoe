import { SemanticQueryPlan } from '../../services/queryCompiler/types';
import { compilePrismaPlan } from '../../services/queryCompiler/prismaCompiler';
import { JoinGraphEdge, TableCatalogRow } from './models';
import { IntentSketch } from './intentSketch';

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
    fullTableCatalog?: TableCatalogRow[];
    glossary: unknown;
    similarExamples: unknown;
    preferredMode: DraftTargetMode;
    constraints: unknown;
    requiredSchema?: string;
    semanticIntent?: IntentSketch;
    candidateTables?: string[];
    rankedCandidates?: Array<{ table: string; score: number; reasons: string[] }>;
    candidateColumnsByTable?: Record<string, string[]>;
    preferredJoinPaths?: Array<{ fromTable: string; fromColumn: string; toTable: string; toColumn: string; score: number; reasons: string[] }>;
    deterministicCandidate?: DeterministicCandidate;
    previousDraftSql?: string;
    validationIssues?: string[];
}

export function buildDraftContext(input: BuildDraftContextInput): Record<string, unknown> {
    return {
        schema: input.schema,
        joinGraph: input.joinGraph,
        tableCatalog: input.tableCatalog,
        fullTableCatalog: input.fullTableCatalog,
        glossary: input.glossary,
        similarExamples: input.similarExamples,
        preferredMode: input.preferredMode,
        constraints: input.constraints,
        requiredSchema: input.requiredSchema,
        semanticIntent: input.semanticIntent,
        candidateTables: input.candidateTables,
        rankedCandidates: input.rankedCandidates,
        candidateColumnsByTable: input.candidateColumnsByTable,
        preferredJoinPaths: input.preferredJoinPaths,
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
