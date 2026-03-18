import { NormalizedKnowledgeEntry } from './types';

export interface SchemaKnowledgeRow {
    table_schema: string;
    table_name: string;
    column_name: string;
    data_type: string;
    table_comment?: string | null;
    column_comment?: string | null;
    enum_values?: string[] | null;
}

export function buildSchemaKnowledgeEntries(rows: SchemaKnowledgeRow[]): NormalizedKnowledgeEntry[] {
    const entries: NormalizedKnowledgeEntry[] = [];
    const seenTables = new Set<string>();

    for (const row of rows) {
        const tableKey = `${row.table_schema}.${row.table_name}`;

        if (row.table_comment && !seenTables.has(tableKey)) {
            entries.push({
                type: 'table_description',
                term: tableKey,
                definition: row.table_comment,
                metadata: { schema: row.table_schema, table: row.table_name, source: 'db_comment' },
                source: 'db_comment',
                sourceKey: `db_comment:${tableKey}`
            });
            seenTables.add(tableKey);
        }

        const columnDefinition = buildColumnDefinition(row);

        if (!columnDefinition) continue;
        entries.push({
            type: 'column_description',
            term: `${tableKey}.${row.column_name}`,
            definition: columnDefinition,
            metadata: {
                schema: row.table_schema,
                table: row.table_name,
                column: row.column_name,
                possibleValues: row.enum_values || undefined,
                source: 'db_comment'
            },
            source: 'db_comment',
            sourceKey: `db_comment:${tableKey}.${row.column_name}`
        });
    }

    return entries;
}

function buildColumnDefinition(row: SchemaKnowledgeRow): string | null {
    const parts = [row.column_comment?.trim()].filter((value): value is string => !!value);

    if (Array.isArray(row.enum_values) && row.enum_values.length > 0) {
        parts.push(`Possible values: ${row.enum_values.join(', ')}.`);
    }

    return parts.length > 0 ? parts.join(' ') : null;
}
