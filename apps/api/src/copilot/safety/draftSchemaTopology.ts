import { z } from 'zod';

const topologySchema = z.record(
    z.string(),
    z.array(
        z.object({
            column: z.string()
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

export function tableExistsInParsedTopology(topology: ParsedTopology, tableName: string): boolean {
    const normalized = normalizeIdentifier(tableName);
    return Object.keys(topology).some((topologyKey) => {
        const parts = topologyKey.split('.');
        const bareTableName = parts.length > 1 ? parts[1] : parts[0];
        return normalizeIdentifier(topologyKey) === normalized || normalizeIdentifier(bareTableName) === normalized;
    });
}
