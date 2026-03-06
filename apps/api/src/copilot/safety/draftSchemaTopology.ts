import { z } from 'zod';

const topologySchema = z.record(
    z.string(),
    z.array(
        z.object({
            column: z.string(),
            isPrimary: z.boolean().optional(),
            foreignKeyTarget: z.string().nullable().optional()
        })
    )
);

type ParsedTopology = z.infer<typeof topologySchema>;

export function normalizeIdentifier(value: string): string {
    return value.replace(/^"+|"+$/g, '').toLowerCase();
}

export function parseTopology(schema: unknown): ParsedTopology | null {
    const parsed = topologySchema.safeParse(schema);

    return parsed.success ? parsed.data : null;
}

export function buildSchemaColumnsByTable(topology: ParsedTopology): Map<string, Set<string>> {
    const byTable = new Map<string, Set<string>>();

    for (const [topologyKey, columns] of Object.entries(topology)) {
        const normalizedKey = normalizeIdentifier(topologyKey);
        const parts = normalizedKey.split('.');
        const tableName = parts.length > 1 ? parts[1] : parts[0];
        const colSet = new Set(columns.map((column) => normalizeIdentifier(column.column)));
        byTable.set(normalizedKey, colSet);

        if (!byTable.has(tableName)) {
            byTable.set(tableName, colSet);
        }
    }

    return byTable;
}

export function getPrimaryKeyByTable(topology: ParsedTopology): Map<string, string> {
    const out = new Map<string, string>();

    for (const [topologyKey, columns] of Object.entries(topology)) {
        const normalizedTable = normalizeIdentifier(topologyKey);
        const explicitPrimary = columns.find((column) => column.isPrimary)?.column;
        const fallbackPrimary = columns.find((column) => normalizeIdentifier(column.column) === 'id')?.column;
        const first = columns[0]?.column;
        const pk = normalizeIdentifier(explicitPrimary || fallbackPrimary || first || 'id');
        out.set(normalizedTable, pk);
        const bare = normalizedTable.split('.')[1] || normalizedTable;

        if (!out.has(bare)) out.set(bare, pk);
    }

    return out;
}

export function getForeignKeyTargets(topology: ParsedTopology): Map<string, string> {
    const out = new Map<string, string>();

    for (const [topologyKey, columns] of Object.entries(topology)) {
        const normalizedTable = normalizeIdentifier(topologyKey);
        const bare = normalizedTable.split('.')[1] || normalizedTable;

        for (const column of columns) {
            if (typeof column.foreignKeyTarget !== 'string' || !column.foreignKeyTarget) continue;
            const normalizedColumn = normalizeIdentifier(column.column);
            const normalizedTarget = normalizeIdentifier(column.foreignKeyTarget);
            out.set(`${normalizedTable}.${normalizedColumn}`, normalizedTarget);
            out.set(`${bare}.${normalizedColumn}`, normalizedTarget);
        }
    }

    return out;
}

export function tableExistsInParsedTopology(topology: ParsedTopology, tableName: string): boolean {
    const normalized = normalizeIdentifier(tableName);

    return Object.keys(topology).some((topologyKey) => {
        const parts = topologyKey.split('.');
        const bareTableName = parts.length > 1 ? parts[1] : parts[0];

        return normalizeIdentifier(topologyKey) === normalized || normalizeIdentifier(bareTableName) === normalized;
    });
}
