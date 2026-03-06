import { Parser } from 'node-sql-parser';
import { QueryValidationError } from './queryValidator';
import { AstSelectStatement, isAstSelectStatement, toAstStatementArray } from './sqlAstTypes';

const parser = new Parser();

interface SqlTableRef {
    db?: string;
    table: string;
}

function collectFromTables(selectNode: AstSelectStatement, out: SqlTableRef[]): void {
    if (!Array.isArray(selectNode.from)) return;

    for (const entry of selectNode.from) {
        if (!entry || typeof entry !== 'object' || typeof entry.table !== 'string') continue;
        out.push({ db: typeof entry.db === 'string' ? entry.db : undefined, table: entry.table });
    }
}

function extractTableRefs(sql: string): SqlTableRef[] {
    const ast = parser.astify(sql, { database: 'Postgresql' });
    const astNodes = toAstStatementArray(ast);
    const refs: SqlTableRef[] = [];

    for (const node of astNodes) {
        if (isAstSelectStatement(node)) collectFromTables(node, refs);
    }

    return refs;
}

function getSchemaTableKeys(schema: unknown): Set<string> {
    if (typeof schema !== 'object' || schema === null) return new Set<string>();

    return new Set<string>(Object.keys(schema).map((k) => k.toLowerCase()));
}

export function validateRunQueryTablesAgainstSchema(sql: string, schema: unknown): void {
    const keys = getSchemaTableKeys(schema);

    if (keys.size === 0) return;

    const refs = extractTableRefs(sql);

    for (const ref of refs) {
        if (ref.db) {
            const qualified = `${ref.db}.${ref.table}`.toLowerCase();

            if (!keys.has(qualified)) throw new QueryValidationError(`Unknown table "${qualified}" in schema snapshot.`);
            continue;
        }

        const publicKey = `public.${ref.table}`.toLowerCase();

        if (keys.has(publicKey)) continue;

        const matches = Array.from(keys).filter((k) => k.endsWith(`.${ref.table.toLowerCase()}`));

        if (matches.length === 1) {
            throw new QueryValidationError(`Table "${ref.table}" must be schema-qualified as "${matches[0]}".`);
        }

        if (matches.length > 1) {
            throw new QueryValidationError(`Table "${ref.table}" is ambiguous across schemas. Use schema-qualified name.`);
        }
        throw new QueryValidationError(`Unknown table "${ref.table}" in schema snapshot.`);
    }
}
