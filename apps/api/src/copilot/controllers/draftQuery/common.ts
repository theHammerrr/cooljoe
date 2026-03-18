import { TopologyColumn, TopologyMap } from './models';

export function normalizeIdentifier(value: string): string {
    return value.replace(/^"+|"+$/g, '').toLowerCase();
}

export function quoteIdentifier(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

export function quoteTableReference(tableName: string): string {
    const parts = tableName.split('.');

    if (parts.length < 2) {
        return quoteIdentifier(parts[0]);
    }

    return `${quoteIdentifier(parts[0])}.${quoteIdentifier(parts[1])}`;
}

export function tryGetTopology(schema: unknown): TopologyMap | null {
    if (typeof schema !== 'object' || schema === null) {
        return null;
    }
    const out: TopologyMap = {};

    for (const [tableKey, rawColumns] of Object.entries(schema)) {
        if (!Array.isArray(rawColumns)) {
            continue;
        }
        const columns: TopologyColumn[] = [];

        for (const rawColumn of rawColumns) {
            if (typeof rawColumn !== 'object' || rawColumn === null) {
                continue;
            }
            const columnName = Reflect.get(rawColumn, 'column');
            const isPrimary = Reflect.get(rawColumn, 'isPrimary');
            const foreignKeyTarget = Reflect.get(rawColumn, 'foreignKeyTarget');

            if (typeof columnName !== 'string') {
                continue;
            }
            columns.push({
                column: columnName,
                isPrimary: typeof isPrimary === 'boolean' ? isPrimary : undefined,
                foreignKeyTarget: typeof foreignKeyTarget === 'string' ? foreignKeyTarget : null
            });
        }
        out[tableKey] = columns;
    }

    return out;
}

export function getPrimaryKeyColumn(columns: TopologyColumn[]): string {
    const primary = columns.find((column) => column.isPrimary);

    if (primary) return primary.column;
    const idColumn = columns.find((column) => normalizeIdentifier(column.column) === 'id');

    return idColumn ? idColumn.column : columns[0]?.column || 'id';
}
