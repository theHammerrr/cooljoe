import { getPrimaryKeyColumn, normalizeIdentifier, tryGetTopology } from './common';
import { JoinGraphEdge, TableCatalogRow } from './models';

export function detectRequestedSchema(question: string, schema: unknown): string | undefined {
    if (typeof schema !== 'object' || schema === null) {
        return undefined;
    }
    const schemaNames = new Set<string>();
    for (const key of Object.keys(schema)) {
        const firstDot = key.indexOf('.');
        if (firstDot > 0) schemaNames.add(key.slice(0, firstDot).toLowerCase());
    }
    const lowerQuestion = question.toLowerCase();
    for (const schemaName of schemaNames) {
        if (new RegExp(`\\b${schemaName}\\b`, 'i').test(lowerQuestion)) {
            return schemaName;
        }
    }
    return undefined;
}

export function buildJoinGraph(schema: unknown, requiredSchema?: string): JoinGraphEdge[] {
    const topology = tryGetTopology(schema);
    if (!topology) return [];
    const normalizedRequiredSchema = requiredSchema?.toLowerCase();
    const edges: JoinGraphEdge[] = [];
    for (const [tableKey, columns] of Object.entries(topology)) {
        if (normalizedRequiredSchema && !tableKey.startsWith(`${normalizedRequiredSchema}.`)) continue;
        for (const column of columns) {
            const foreignKeyTarget = column.foreignKeyTarget;
            if (typeof foreignKeyTarget !== 'string' || !foreignKeyTarget) continue;
            if (normalizedRequiredSchema && !foreignKeyTarget.startsWith(`${normalizedRequiredSchema}.`)) continue;
            const targetColumns = topology[foreignKeyTarget];
            if (!targetColumns || !targetColumns.length) continue;
            edges.push({
                fromTable: tableKey,
                fromColumn: column.column,
                toTable: foreignKeyTarget,
                toColumn: getPrimaryKeyColumn(targetColumns)
            });
        }
    }
    return edges;
}

export function buildTableCatalog(schema: unknown, requiredSchema?: string): TableCatalogRow[] {
    const topology = tryGetTopology(schema);
    if (!topology) return [];
    const required = requiredSchema ? normalizeIdentifier(requiredSchema) : '';
    return Object.entries(topology)
        .filter(([table]) => !required || table.startsWith(`${required}.`))
        .map(([table, columns]) => ({
            table,
            columns: columns.map((column) => column.column),
            foreignKeys: columns
                .filter((column) => typeof column.foreignKeyTarget === 'string' && column.foreignKeyTarget.length > 0)
                .map((column) => `${column.column} -> ${column.foreignKeyTarget}`)
        }));
}
