export interface JoinGraphEdge {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
}

export interface DraftQueryResult {
    intent: string;
    assumptions: string[];
    sql: string;
    prisma: string;
    expectedColumns: string[];
    riskFlags: string[];
}

export interface TopologyColumn {
    column: string;
    isPrimary?: boolean;
    foreignKeyTarget?: string | null;
}

export type TopologyMap = Record<string, TopologyColumn[]>;

export interface TableCatalogRow {
    table: string;
    columns: string[];
    foreignKeys: string[];
}

export interface JoinPathStep {
    leftTable: string;
    leftColumn: string;
    rightTable: string;
    rightColumn: string;
}
