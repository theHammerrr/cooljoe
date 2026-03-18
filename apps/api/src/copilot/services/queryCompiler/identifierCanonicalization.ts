import { SemanticQueryPlan, StructuredSemanticQueryPlan } from './types';

interface IdentifierCatalog {
    canonicalTableByNormalized: Map<string, string>;
    canonicalTableByBareNormalized: Map<string, string>;
    canonicalColumnByTableAndNormalized: Map<string, Map<string, string>>;
}

function normalizeIdentifier(value: string): string {
    return value.replace(/^"+|"+$/g, '').toLowerCase();
}

function createEmptyIdentifierCatalog(): IdentifierCatalog {
    return {
        canonicalTableByNormalized: new Map<string, string>(),
        canonicalTableByBareNormalized: new Map<string, string>(),
        canonicalColumnByTableAndNormalized: new Map<string, Map<string, string>>()
    };
}

function buildIdentifierCatalog(schema: unknown): IdentifierCatalog {
    const catalog = createEmptyIdentifierCatalog();
    const ambiguousBareTables = new Set<string>();

    if (typeof schema !== 'object' || schema === null) return catalog;

    for (const [tableName, rawColumns] of Object.entries(schema)) {
        indexTableIdentifier(tableName, catalog, ambiguousBareTables);
        catalog.canonicalColumnByTableAndNormalized.set(normalizeIdentifier(tableName), buildColumnIdentifierMap(rawColumns));
    }

    return catalog;
}

function indexTableIdentifier(tableName: string, catalog: IdentifierCatalog, ambiguousBareTables: Set<string>): void {
    const normalizedTable = normalizeIdentifier(tableName);
    const normalizedBareTable = normalizeIdentifier(tableName.split('.').slice(-1)[0] || tableName);

    catalog.canonicalTableByNormalized.set(normalizedTable, tableName);

    if (ambiguousBareTables.has(normalizedBareTable)) {
        catalog.canonicalTableByBareNormalized.delete(normalizedBareTable);

        return;
    }

    if (catalog.canonicalTableByBareNormalized.has(normalizedBareTable)) {
        catalog.canonicalTableByBareNormalized.delete(normalizedBareTable);
        ambiguousBareTables.add(normalizedBareTable);

        return;
    }

    catalog.canonicalTableByBareNormalized.set(normalizedBareTable, tableName);
}

function buildColumnIdentifierMap(rawColumns: unknown): Map<string, string> {
    const columnMap = new Map<string, string>();

    if (!Array.isArray(rawColumns)) return columnMap;

    for (const rawColumn of rawColumns) {
        if (typeof rawColumn !== 'object' || rawColumn === null) continue;
        const columnName = Reflect.get(rawColumn, 'column');

        if (typeof columnName !== 'string' || !columnName) continue;
        const normalizedColumn = normalizeIdentifier(columnName);

        if (!columnMap.has(normalizedColumn)) columnMap.set(normalizedColumn, columnName);
    }

    return columnMap;
}

function resolveCanonicalTable(table: string, catalog: IdentifierCatalog): string {
    const normalizedTable = normalizeIdentifier(table);

    return catalog.canonicalTableByNormalized.get(normalizedTable)
        || catalog.canonicalTableByBareNormalized.get(normalizedTable)
        || table;
}

function resolveCanonicalColumn(table: string, column: string, catalog: IdentifierCatalog): string {
    if (column === '*') return column;
    const columnMap = catalog.canonicalColumnByTableAndNormalized.get(normalizeIdentifier(table));

    return columnMap?.get(normalizeIdentifier(column)) || column;
}

function canonicalizeTableNode<T extends { table: string; column: string }>(node: T, catalog: IdentifierCatalog): T {
    const canonicalTable = resolveCanonicalTable(node.table, catalog);

    return { ...node, table: canonicalTable, column: resolveCanonicalColumn(canonicalTable, node.column, catalog) };
}

function canonicalizeJoinNode<T extends { fromTable: string; fromColumn: string; toTable: string; toColumn: string }>(
    node: T,
    catalog: IdentifierCatalog
): T {
    const canonicalFromTable = resolveCanonicalTable(node.fromTable, catalog);
    const canonicalToTable = resolveCanonicalTable(node.toTable, catalog);

    return {
        ...node,
        fromTable: canonicalFromTable,
        fromColumn: resolveCanonicalColumn(canonicalFromTable, node.fromColumn, catalog),
        toTable: canonicalToTable,
        toColumn: resolveCanonicalColumn(canonicalToTable, node.toColumn, catalog)
    };
}

export function canonicalizeSemanticPlanIdentifiers(plan: SemanticQueryPlan, schema: unknown): SemanticQueryPlan {
    if (plan.requires_raw_sql) return plan;
    const catalog = buildIdentifierCatalog(schema);
    const structuredPlan: StructuredSemanticQueryPlan = plan;

    return {
        ...structuredPlan,
        select: structuredPlan.select.map((node) => canonicalizeTableNode(node, catalog)),
        filters: structuredPlan.filters?.map((node) => canonicalizeTableNode(node, catalog)),
        groupBy: structuredPlan.groupBy?.map((node) => canonicalizeTableNode(node, catalog)),
        orderBy: structuredPlan.orderBy?.map((node) => canonicalizeTableNode(node, catalog)),
        joins: structuredPlan.joins?.map((node) => canonicalizeJoinNode(node, catalog))
    };
}

