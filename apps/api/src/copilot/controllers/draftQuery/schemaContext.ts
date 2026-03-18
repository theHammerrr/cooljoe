import { getPrimaryKeyColumn, normalizeIdentifier, tryGetTopology } from './common';
import { JoinGraphEdge, TableCatalogRow } from './models';

export function detectRequestedSchema(question: string, schema: unknown): string | undefined {
    if (typeof schema !== 'object' || schema === null) {
        return undefined;
    }
    const schemaNames = new Map<string, string>();

    for (const key of Object.keys(schema)) {
        const firstDot = key.indexOf('.');

        if (firstDot > 0) {
            const schemaName = key.slice(0, firstDot);

            schemaNames.set(normalizeIdentifier(schemaName), schemaName);
        }
    }
    const lowerQuestion = question.toLowerCase();

    for (const [normalizedSchemaName, schemaName] of schemaNames) {
        if (new RegExp(`\\b${normalizedSchemaName}\\b`, 'i').test(lowerQuestion)) {
            return schemaName;
        }
    }

    return undefined;
}

export function buildJoinGraph(schema: unknown, requiredSchema?: string): JoinGraphEdge[] {
    const topology = tryGetTopology(schema);

    if (!topology) return [];
    const normalizedRequiredSchema = requiredSchema ? normalizeIdentifier(requiredSchema) : undefined;
    const edges: JoinGraphEdge[] = [];

    for (const [tableKey, columns] of Object.entries(topology)) {
        const [schemaName] = tableKey.split('.');

        if (normalizedRequiredSchema && normalizeIdentifier(schemaName || '') !== normalizedRequiredSchema) continue;

        for (const column of columns) {
            const foreignKeyTarget = column.foreignKeyTarget;

            if (typeof foreignKeyTarget !== 'string' || !foreignKeyTarget) continue;
            const [targetSchemaName] = foreignKeyTarget.split('.');

            if (normalizedRequiredSchema && normalizeIdentifier(targetSchemaName || '') !== normalizedRequiredSchema) continue;
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
        .filter(([table]) => {
            if (!required) return true;
            const [schemaName] = table.split('.');

            return normalizeIdentifier(schemaName || '') === required;
        })
        .map(([table, columns]) => ({
            table,
            columns: columns.map((column) => column.column),
            foreignKeys: columns
                .filter((column) => typeof column.foreignKeyTarget === 'string' && column.foreignKeyTarget.length > 0)
                .map((column) => `${column.column} -> ${column.foreignKeyTarget}`)
        }));
}
