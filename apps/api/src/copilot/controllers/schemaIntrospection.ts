import { z } from 'zod';

export interface TopologyColumn {
    column: string;
    type: string;
    isPrimary: boolean;
    foreignKeyTarget: string | null;
}

const schemaRowSchema = z.object({
    table_schema: z.string(),
    table_name: z.string(),
    column_name: z.string(),
    data_type: z.string(),
    is_primary: z.string().nullable().optional(),
    foreign_key_target: z.string().nullable().optional(),
    table_comment: z.string().nullable().optional(),
    column_comment: z.string().nullable().optional(),
    enum_values: z.array(z.string()).nullable().optional()
});

export type SchemaRow = z.infer<typeof schemaRowSchema>;
export const schemaRowsSchema = z.array(schemaRowSchema);
export const schemaQuery = `
    SELECT
        c.table_schema, c.table_name, c.column_name, c.data_type,
        (SELECT tc.constraint_type FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND kcu.table_schema = c.table_schema AND kcu.table_name = c.table_name AND kcu.column_name = c.column_name LIMIT 1) as is_primary,
        (SELECT ccu.table_schema || '.' || ccu.table_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_schema = c.table_schema AND kcu.table_name = c.table_name AND kcu.column_name = c.column_name LIMIT 1) as foreign_key_target,
        (SELECT pgd.description FROM pg_catalog.pg_statio_all_tables st JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = 0 WHERE st.schemaname = c.table_schema AND st.relname = c.table_name LIMIT 1) as table_comment,
        col_description(format('%I.%I', c.table_schema, c.table_name)::regclass, c.ordinal_position) as column_comment,
        CASE WHEN c.data_type = 'USER-DEFINED' THEN (SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = c.udt_name) ELSE NULL END as enum_values
    FROM information_schema.columns c
    WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog');
`;

export function buildTopology(rows: SchemaRow[]): Record<string, TopologyColumn[]> {
    return rows.reduce<Record<string, TopologyColumn[]>>((acc, row) => {
        const tableKey = `${row.table_schema}.${row.table_name}`;
        const columns = acc[tableKey] || [];

        columns.push({ column: row.column_name, type: row.data_type, isPrimary: row.is_primary === 'PRIMARY KEY', foreignKeyTarget: row.foreign_key_target || null });
        acc[tableKey] = columns;

        return acc;
    }, {});
}
