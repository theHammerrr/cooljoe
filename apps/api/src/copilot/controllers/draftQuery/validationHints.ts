import { normalizeIdentifier, quoteIdentifier, quoteTableReference, tryGetTopology } from './common';
import { JoinGraphEdge, JoinPathStep } from './models';

function findShortestJoinPath(startTable: string, targetTable: string, edges: JoinGraphEdge[]): JoinPathStep[] {
    if (startTable === targetTable) return [];
    const queue: { table: string; path: JoinPathStep[] }[] = [{ table: startTable, path: [] }];
    const visited = new Set<string>([startTable]);

    while (queue.length) {
        const current = queue.shift();

        if (!current) continue;

        for (const edge of edges) {
            if (edge.fromTable === current.table) {
                const path = current.path.concat([{ leftTable: edge.fromTable, leftColumn: edge.fromColumn, rightTable: edge.toTable, rightColumn: edge.toColumn }]);

                if (edge.toTable === targetTable) return path;

                if (!visited.has(edge.toTable)) { visited.add(edge.toTable); queue.push({ table: edge.toTable, path }); }
            }

            if (edge.toTable === current.table) {
                const path = current.path.concat([{ leftTable: edge.toTable, leftColumn: edge.toColumn, rightTable: edge.fromTable, rightColumn: edge.fromColumn }]);

                if (edge.fromTable === targetTable) return path;

                if (!visited.has(edge.fromTable)) { visited.add(edge.fromTable); queue.push({ table: edge.fromTable, path }); }
            }
        }
    }

    return [];
}

function formatJoinPath(path: JoinPathStep[]): string {
    return path
        .map((step) => {
            const leftTable = quoteTableReference(step.leftTable);
            const rightTable = quoteTableReference(step.rightTable);

            return `JOIN ${rightTable} ON ${leftTable}.${quoteIdentifier(step.leftColumn)} = ${rightTable}.${quoteIdentifier(step.rightColumn)}`;
        })
        .join('\n');
}

export function buildValidationDrivenHints(
    errors: string[],
    schema: unknown,
    joinGraph: JoinGraphEdge[],
    requiredSchema?: string
): string[] {
    const topology = tryGetTopology(schema);

    if (!topology) return [];
    const required = requiredSchema ? normalizeIdentifier(requiredSchema) : '';
    const hints = new Set<string>();

    for (const error of errors) {
        const match = error.match(/^Unknown column "([^"]+)" in table "([^"]+)"$/);

        if (!match) continue;
        const columnName = normalizeIdentifier(match[1]);
        const sourceTable = normalizeIdentifier(match[2]);
        const targetTable = Object.entries(topology).find(([tableName, columns]) =>
            tableName !== sourceTable &&
            (!required || tableName.startsWith(`${required}.`)) &&
            columns.some((column) => column.column === columnName)
        )?.[0];

        if (!targetTable) continue;
        const path = findShortestJoinPath(sourceTable, targetTable, joinGraph);

        if (!path.length) continue;
        hints.add(`Column "${columnName}" does not belong to "${sourceTable}". Use "${targetTable}" for that column.`);
        const joinSql = formatJoinPath(path);

        if (joinSql) hints.add(`Required JOIN chain:\n${joinSql}`);
    }

    return Array.from(hints);
}
