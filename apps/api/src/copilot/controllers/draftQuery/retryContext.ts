import { normalizeIdentifier, tryGetTopology } from './common';
import { JoinGraphEdge, TableCatalogRow, TopologyMap } from './models';

interface RetryContextSubset {
    focusTables: string[];
    schema: TopologyMap;
    joinGraph: JoinGraphEdge[];
    tableCatalog: TableCatalogRow[];
}

function extractTablesFromSql(sql: string): Set<string> {
    const tables = new Set<string>();

    for (const match of sql.matchAll(/"?([a-zA-Z0-9_]+)"?\."?([a-zA-Z0-9_]+)"?/g)) {
        const schemaName = normalizeIdentifier(match[1]);
        const tableName = normalizeIdentifier(match[2]);

        tables.add(`${schemaName}.${tableName}`);
    }

    return tables;
}

function extractTablesFromErrors(errors: string[]): Set<string> {
    const tables = new Set<string>();

    for (const error of errors) {
        const unknownColumnMatch = error.match(/^Unknown column "([^"]+)" in table "([^"]+)"$/);

        if (unknownColumnMatch) {
            tables.add(normalizeIdentifier(unknownColumnMatch[2]));
        }
    }

    return tables;
}

function expandWithJoinNeighbors(seedTables: Set<string>, joinGraph: JoinGraphEdge[]): Set<string> {
    const expanded = new Set<string>(seedTables);

    for (const edge of joinGraph) {
        if (seedTables.has(edge.fromTable) || seedTables.has(edge.toTable)) {
            expanded.add(edge.fromTable);
            expanded.add(edge.toTable);
        }
    }

    return expanded;
}

function filterTableCatalog(tableCatalog: unknown, allowedTables: Set<string>): TableCatalogRow[] {
    if (!Array.isArray(tableCatalog)) return [];

    return tableCatalog.filter((row): row is TableCatalogRow => {
        if (!row || typeof row !== 'object') return false;

        if (!('table' in row) || typeof row.table !== 'string') return false;

        return allowedTables.has(normalizeIdentifier(row.table));
    });
}

export function buildRetryContextSubset(
    schema: unknown,
    joinGraph: JoinGraphEdge[],
    tableCatalog: unknown,
    validationErrors: string[],
    previousDraftSql: string
): RetryContextSubset | null {
    const topology = tryGetTopology(schema);

    if (!topology) return null;

    const referencedTables = new Set<string>([
        ...extractTablesFromSql(previousDraftSql),
        ...extractTablesFromErrors(validationErrors)
    ]);

    if (referencedTables.size === 0) return null;

    const focusTables = expandWithJoinNeighbors(referencedTables, joinGraph);

    const narrowedSchemaEntries = Object.entries(topology).filter(([table]) => focusTables.has(table));

    if (narrowedSchemaEntries.length === 0) return null;

    const narrowedSchema = Object.fromEntries(narrowedSchemaEntries);
    const narrowedJoinGraph = joinGraph.filter((edge) => focusTables.has(edge.fromTable) && focusTables.has(edge.toTable));
    const narrowedCatalog = filterTableCatalog(tableCatalog, focusTables);

    return {
        focusTables: Array.from(focusTables),
        schema: narrowedSchema,
        joinGraph: narrowedJoinGraph,
        tableCatalog: narrowedCatalog
    };
}
