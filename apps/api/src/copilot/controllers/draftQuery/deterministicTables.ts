import { normalizeIdentifier, tryGetTopology } from './common';

export interface TableRef {
    fullName: string;
    schemaName: string;
    tableName: string;
    normalizedSchemaName: string;
    normalizedTableName: string;
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
        const normalizedSchemaName = normalizeIdentifier(schemaName);
        const normalizedTableName = normalizeIdentifier(tableName);

        if (required && normalizedSchemaName !== required) continue;
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
            normalizedSchemaName,
            normalizedTableName,
            columns: columnNames,
            columnsSet: new Set(columnNames),
            fkByColumn
        });
    }

    return refs;
}

export function tableMentioned(question: string, tableName: string, schemaName: string): boolean {
    const lowerQuestion = normalizeIdentifier(question);
    const normalizedTableName = normalizeIdentifier(tableName);
    const normalizedSchemaName = normalizeIdentifier(schemaName);
    const singular = normalizedTableName.endsWith('s') ? normalizedTableName.slice(0, -1) : normalizedTableName;
    const plural = normalizedTableName.endsWith('s') ? normalizedTableName : `${normalizedTableName}s`;
    const variants = [normalizedTableName, singular, plural, `${normalizedSchemaName}.${normalizedTableName}`];

    return variants.some((variant) => new RegExp(`\\b${variant.replace('.', '\\.')}\\b`, 'i').test(lowerQuestion));
}

export function findColumnForName(columnsSet: Set<string>): string[] {
    const picks: string[] = [];
    const columnsByNormalized = new Map(Array.from(columnsSet).map((column) => [normalizeIdentifier(column), column]));
    const firstNameColumn = columnsByNormalized.get('first_name');
    const lastNameColumn = columnsByNormalized.get('last_name');
    const nameColumn = columnsByNormalized.get('name');

    if (typeof firstNameColumn === 'string') picks.push(firstNameColumn);

    if (typeof lastNameColumn === 'string') picks.push(lastNameColumn);

    if (!picks.length && typeof nameColumn === 'string') picks.push(nameColumn);

    return picks;
}
