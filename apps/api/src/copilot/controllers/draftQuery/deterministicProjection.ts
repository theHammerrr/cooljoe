import { getPrimaryKeyColumn } from './common';
import { findColumnForName, TableRef } from './deterministicTables';
import { TopologyColumn } from './models';

function buildPkColumns(table: TableRef): TopologyColumn[] {
    return table.columns.map((column) => ({ column }));
}

export function selectDeterministicColumns(table: TableRef): string[] {
    const selectedColumns: string[] = [];
    const primaryKey = getPrimaryKeyColumn(buildPkColumns(table));
    const preferredColumns = [
        primaryKey,
        ...findColumnForName(table.columnsSet),
        'status',
        'state',
        'type',
        'created_at',
        'updated_at'
    ];

    for (const column of preferredColumns) {
        if (!table.columnsSet.has(column) || selectedColumns.includes(column)) continue;
        selectedColumns.push(column);

        if (selectedColumns.length >= 5) {
            return selectedColumns;
        }
    }

    for (const column of table.columns) {
        if (selectedColumns.includes(column)) continue;
        selectedColumns.push(column);

        if (selectedColumns.length >= 5) {
            return selectedColumns;
        }
    }

    return selectedColumns;
}
