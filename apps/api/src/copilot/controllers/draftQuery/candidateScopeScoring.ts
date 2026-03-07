import { normalizeIdentifier } from './common';
import { IntentSketch } from './intentSketch';
import { JoinGraphEdge, TableCatalogRow } from './models';
import { RankedCandidateColumn, RankedCandidateTable, RankedJoinPath } from './candidateScope';

export function scoreTable(row: TableCatalogRow, intentSketch: IntentSketch): RankedCandidateTable {
    const reasons: string[] = [];
    let score = 0;
    const normalizedTable = normalizeIdentifier(row.table);
    const bareTable = normalizedTable.split('.').slice(-1)[0];

    if (intentSketch.entities.includes(normalizedTable) || intentSketch.entities.some((entity) => entity.endsWith(`.${bareTable}`))) {
        score += 5;
        reasons.push('explicit entity match');
    }

    if (intentSketch.explicitMeasure && row.columns.some((column) => normalizeIdentifier(column).includes(intentSketch.explicitMeasure || ''))) {
        score += 3;
        reasons.push('measure column match');
    }

    if ((intentSketch.asksForTimeBucket || intentSketch.asksForTimeRange) && row.columns.some(isTimeColumn)) {
        score += 2;
        reasons.push('time column availability');
    }

    if (intentSketch.dimensions.some((dimension) => bareTable.includes(dimension) || row.columns.some((column) => normalizeIdentifier(column).includes(dimension)))) {
        score += 1;
        reasons.push('dimension overlap');
    }

    return { table: normalizedTable, score, reasons };
}

export function scoreColumns(row: TableCatalogRow, intentSketch: IntentSketch): RankedCandidateColumn[] {
    return row.columns
        .map((column) => {
            const normalizedColumn = normalizeIdentifier(column);
            const reasons: string[] = [];
            let score = 0;

            if (intentSketch.explicitMeasure && measureMatches(intentSketch.explicitMeasure, normalizedColumn)) {
                score += 5;
                reasons.push('explicit measure match');
            }

            if (intentSketch.asksForCount && /\b(id|count)\b/i.test(normalizedColumn)) {
                score += 2;
                reasons.push('count-friendly column');
            }

            if ((intentSketch.asksForTimeBucket || intentSketch.asksForTimeRange) && isTimeColumn(normalizedColumn)) {
                score += 4;
                reasons.push('time column match');
            }

            if (intentSketch.dimensions.some((dimension) => normalizedColumn.includes(dimension))) {
                score += 3;
                reasons.push('dimension column match');
            }

            if (/\b(name|title|status|type)\b/i.test(normalizedColumn)) {
                score += 1;
                reasons.push('presentation column');
            }

            return {
                table: normalizeIdentifier(row.table),
                column: normalizedColumn,
                score,
                reasons
            };
        })
        .filter((candidate) => candidate.score > 0);
}

export function scoreJoinPaths(joinGraph: JoinGraphEdge[], focusTableSet: Set<string>, rankedTables: RankedCandidateTable[]): RankedJoinPath[] {
    const tableScores = new Map(rankedTables.map((candidate) => [candidate.table, candidate.score]));

    return joinGraph
        .filter((edge) => focusTableSet.has(edge.fromTable) && focusTableSet.has(edge.toTable))
        .map((edge) => {
            const reasons: string[] = ['join-graph path'];
            const score = (tableScores.get(edge.fromTable) || 0) + (tableScores.get(edge.toTable) || 0);

            if ((tableScores.get(edge.fromTable) || 0) > 0) reasons.push('connects ranked source');

            if ((tableScores.get(edge.toTable) || 0) > 0) reasons.push('connects ranked target');

            return { ...edge, score, reasons };
        })
        .sort((left, right) => right.score - left.score || left.fromTable.localeCompare(right.fromTable));
}

function isTimeColumn(column: string): boolean {
    return /\b(date|time|created_at|updated_at|timestamp)\b/i.test(column);
}

function measureMatches(explicitMeasure: string, normalizedColumn: string): boolean {
    if (normalizedColumn.includes(explicitMeasure)) return true;

    if (explicitMeasure === 'revenue') return /\b(amount|revenue|gmv|arr|mrr)\b/i.test(normalizedColumn);

    return false;
}
