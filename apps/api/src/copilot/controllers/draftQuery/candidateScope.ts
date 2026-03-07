import { normalizeIdentifier, tryGetTopology } from './common';
import { IntentSketch } from './intentSketch';
import { JoinGraphEdge, TableCatalogRow, TopologyMap } from './models';
import { scoreColumns, scoreJoinPaths, scoreTable } from './candidateScopeScoring';
import { buildCandidateColumnsByTable } from './candidateColumns';

const MAX_RANKED_TABLES = 6;

export interface RankedCandidateTable {
    table: string;
    score: number;
    reasons: string[];
}

export interface RankedCandidateColumn {
    table: string;
    column: string;
    score: number;
    reasons: string[];
}

export interface RankedJoinPath {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    score: number;
    reasons: string[];
}

export interface RankedDraftContext {
    schema: TopologyMap;
    joinGraph: JoinGraphEdge[];
    tableCatalog: TableCatalogRow[];
    rankedTables: RankedCandidateTable[];
    rankedColumns: RankedCandidateColumn[];
    preferredJoinPaths: RankedJoinPath[];
    focusTables: string[];
    candidateColumnsByTable: Record<string, string[]>;
}

export function buildRankedDraftContext(
    schema: unknown,
    joinGraph: JoinGraphEdge[],
    tableCatalog: TableCatalogRow[],
    intentSketch: IntentSketch
): RankedDraftContext | null {
    const topology = tryGetTopology(schema);

    if (!topology) return null;

    const rankedTables = tableCatalog
        .map((row) => scoreTable(row, intentSketch))
        .filter((row) => row.score > 0)
        .sort((left, right) => right.score - left.score || left.table.localeCompare(right.table));

    const seedTables = rankedTables.slice(0, MAX_RANKED_TABLES).map((row) => row.table);
    const focusTables = expandCandidateNeighbors(seedTables, joinGraph).slice(0, MAX_RANKED_TABLES);
    const focusTableSet = new Set(focusTables);
    const narrowedCatalog = tableCatalog.filter((row) => focusTableSet.has(normalizeIdentifier(row.table)));
    const rankedColumns = narrowedCatalog.flatMap((row) => scoreColumns(row, intentSketch))
        .sort((left, right) => right.score - left.score || left.table.localeCompare(right.table) || left.column.localeCompare(right.column));
    const candidateColumnsByTable = buildCandidateColumnsByTable(rankedColumns, narrowedCatalog, intentSketch.mentionedColumns);
    const preferredJoinPaths = scoreJoinPaths(joinGraph, focusTableSet, rankedTables);

    return {
        schema: Object.fromEntries(Object.entries(topology).filter(([table]) => focusTableSet.has(table))),
        joinGraph: joinGraph.filter((edge) => focusTableSet.has(edge.fromTable) && focusTableSet.has(edge.toTable)),
        tableCatalog: narrowedCatalog,
        rankedTables,
        rankedColumns,
        preferredJoinPaths,
        focusTables,
        candidateColumnsByTable
    };
}

function expandCandidateNeighbors(seedTables: string[], joinGraph: JoinGraphEdge[]): string[] {
    const focusTables = new Set<string>(seedTables);

    for (const edge of joinGraph) {
        if (focusTables.has(edge.fromTable) || focusTables.has(edge.toTable)) {
            focusTables.add(edge.fromTable);
            focusTables.add(edge.toTable);
        }
    }

    return Array.from(focusTables);
}
