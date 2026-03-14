import { executeTargetQueryRaw } from '../executionService';
import type { QueryAnalysisIndexMetadata, QueryAnalysisPlanNode } from './types';
import { normalizePlanNode } from './queryAnalysisPlanNormalization';

interface PostgresIndexRow {
    schema_name: string;
    table_name: string;
    index_name: string;
    access_method: string;
    is_primary: boolean;
    is_unique: boolean;
    columns: string[] | null;
    definition: string;
}

interface ExplainPlanRow {
    'QUERY PLAN': Array<Record<string, unknown>>;
}

export async function loadExplainPlan(safeSql: string): Promise<QueryAnalysisPlanNode> {
    const result = await executeTargetQueryRaw<ExplainPlanRow>(`EXPLAIN (FORMAT JSON) ${safeSql}`);
    const planList = result.rows[0]?.['QUERY PLAN'];
    const topLevelPlan = Array.isArray(planList) ? planList[0] : undefined;
    const rawPlan = typeof topLevelPlan === 'object' && topLevelPlan !== null ? Reflect.get(topLevelPlan, 'Plan') : undefined;

    if (typeof rawPlan !== 'object' || rawPlan === null) {
        throw new Error('Target database returned an invalid EXPLAIN plan payload.');
    }

    return normalizePlanNode(rawPlan);
}

export async function loadIndexMetadata(referencedTables: string[]): Promise<QueryAnalysisIndexMetadata[]> {
    if (referencedTables.length === 0) {
        return [];
    }

    const unqualifiedTableNames = referencedTables.map((table) => table.includes('.') ? table.split('.').at(-1) || table : table);
    const rows = await executeTargetQueryRaw<PostgresIndexRow>(`
        SELECT
            ns.nspname AS schema_name,
            tbl.relname AS table_name,
            idx.relname AS index_name,
            am.amname AS access_method,
            ix.indisprimary AS is_primary,
            ix.indisunique AS is_unique,
            ARRAY(
                SELECT pg_get_indexdef(ix.indexrelid, key_position, true)
                FROM generate_subscripts(ix.indkey, 1) AS key_position
                ORDER BY key_position
            ) AS columns,
            pg_get_indexdef(ix.indexrelid) AS definition
        FROM pg_index ix
        JOIN pg_class tbl ON tbl.oid = ix.indrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        JOIN pg_class idx ON idx.oid = ix.indexrelid
        JOIN pg_am am ON am.oid = idx.relam
        WHERE ns.nspname NOT IN ('pg_catalog', 'information_schema')
          AND ((ns.nspname || '.' || tbl.relname) = ANY($1::text[]) OR tbl.relname = ANY($2::text[]))
        ORDER BY ns.nspname, tbl.relname, ix.indisprimary DESC, idx.relname
    `, [referencedTables, unqualifiedTableNames]);

    return rows.rows.map((row) => ({
        schemaName: row.schema_name,
        tableName: row.table_name,
        indexName: row.index_name,
        accessMethod: row.access_method,
        isPrimary: Boolean(row.is_primary),
        isUnique: Boolean(row.is_unique),
        columns: Array.isArray(row.columns) ? row.columns : [],
        definition: row.definition
    }));
}
