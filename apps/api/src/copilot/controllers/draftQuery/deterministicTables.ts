import { normalizeIdentifier, tryGetTopology } from './common';

export interface TableRef {
    fullName: string;
    schemaName: string;
    tableName: string;
    columns: string[];
    columnsSet: Set<string>;
    fkByColumn: Map<string, string>;
}

export function buildTableRefs(schema: unknown, requiredSchema?: string): TableRef[] {
    const topology = tryGetTopology(schema);
    if (!topology) return [];
    const required = requiredSchema ? normalizeIdentifier(requiredSchema) : '';
    const refs: TableRef[] = [];
    for (const [fullName, columns] of Object.entries(topology)) {
        const parts = fullName.split('.');
        if (parts.length < 2) continue;
        const schemaName = parts[0];
        const tableName = parts.slice(1).join('.');
        if (required && schemaName !== required) continue;
        const columnNames = columns.map((column) => column.column);
        const fkByColumn = new Map<string, string>();
        for (const column of columns) {
            if (typeof column.foreignKeyTarget === 'string' && column.foreignKeyTarget) {
                fkByColumn.set(column.column, column.foreignKeyTarget);
            }
        }
        refs.push({
            fullName,
            schemaName,
            tableName,
            columns: columnNames,
            columnsSet: new Set(columnNames),
            fkByColumn
        });
    }
    return refs;
}

export function tableMentioned(question: string, tableName: string, schemaName: string): boolean {
    const lowerQuestion = normalizeIdentifier(question);
    const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
    const plural = tableName.endsWith('s') ? tableName : `${tableName}s`;
    const variants = [tableName, singular, plural, `${schemaName}.${tableName}`];
    return variants.some((variant) => new RegExp(`\\b${variant.replace('.', '\\.')}\\b`, 'i').test(lowerQuestion));
}

export function findColumnForName(columnsSet: Set<string>): string[] {
    const picks: string[] = [];
    if (columnsSet.has('first_name')) picks.push('first_name');
    if (columnsSet.has('last_name')) picks.push('last_name');
    if (!picks.length && columnsSet.has('name')) picks.push('name');
    return picks;
}
