import { AST, Parser } from 'node-sql-parser';
import { isAstSelectStatement, toAstStatementArray } from './sqlAstTypes';
import {
    normalizeQuotedSchemaTableIdentifiers,
    prepareSqlForParser,
    restoreIdentifierToken,
    restoreSqlIdentifiers
} from './queryValidatorSql';

const parser = new Parser();

export { normalizeQuotedSchemaTableIdentifiers };

export class QueryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'QueryValidationError';
    }
}

export class DisallowedTableError extends QueryValidationError {
    constructor(public readonly tableName: string) {
        super(`Table not in allowlist: ${tableName}`);
        this.name = 'DisallowedTableError';
    }
}

export class DisallowedStatementError extends QueryValidationError {
    constructor(public readonly statementType: string) {
        super(`Only SELECT statements are allowed. Found: ${statementType}`);
        this.name = 'DisallowedStatementError';
    }
}

export class SQLSyntaxError extends QueryValidationError {
    constructor(public readonly parseMessage: string) {
        super(`AI generated invalid SQL Syntax. Ensure your prompt asks clearly for executable Read-Only SQL. Parser Trace: ${parseMessage}`);
        this.name = 'SQLSyntaxError';
    }
}

function extractTablesFromAst(astNodes: unknown[], placeholderMap: Map<string, string>): string[] {
    const tables = new Set<string>();

    for (const node of astNodes) {
        if (!isAstSelectStatement(node) || !Array.isArray(node.from)) continue;

        for (const fromEntry of node.from) {
            if (!fromEntry || typeof fromEntry !== 'object' || typeof fromEntry.table !== 'string' || !fromEntry.table) continue;

            const tableName = restoreIdentifierToken(fromEntry.table, placeholderMap);
            const schemaName = typeof fromEntry.db === 'string' ? restoreIdentifierToken(fromEntry.db, placeholderMap) : '';

            tables.add(schemaName ? `${schemaName}.${tableName}`.toLowerCase() : tableName.toLowerCase());
        }
    }

    return Array.from(tables);
}

export function parseQueryAst(sql: string): AST | AST[] {
    try {
        return parser.astify(prepareSqlForParser(sql).parserSql, { database: 'Postgresql' });
    } catch (error: unknown) {
        const parseMessage = error instanceof Error ? error.message : 'Unknown Parser Error';
        throw new SQLSyntaxError(parseMessage);
    }
}

export function extractReferencedTablesFromQuery(sql: string): string[] {
    const prepared = prepareSqlForParser(sql);

    return extractTablesFromAst(toAstStatementArray(parseQueryAst(sql)), prepared.placeholderMap);
}

export function validateAndFormatQuery(
    sql: string,
    allowlist: string[],
    maxLimit = 100,
    options: { enforceAllowlist?: boolean } = {}
): string {
    const prepared = prepareSqlForParser(sql);
    const ast = parseQueryAst(sql);
    const astArray = toAstStatementArray(ast);

    for (const tableStr of extractTablesFromAst(astArray, prepared.placeholderMap)) {
        const tableName = tableStr.split('.').at(-1) || tableStr;

        if (options.enforceAllowlist !== false && !allowlist.includes(tableName.toLowerCase())) {
            throw new DisallowedTableError(tableName);
        }
    }

    for (const node of astArray) {
        if (!isAstSelectStatement(node)) throw new DisallowedStatementError(typeof node.type === 'string' ? node.type : 'unknown');

        const currentLimit = node.limit?.value?.[0]?.value;
        const numericLimit = typeof currentLimit === 'number' ? currentLimit : Number(currentLimit);

        if (!node.limit?.value?.length) {
            node.limit = { seperator: '', value: [{ type: 'number', value: maxLimit }] };
            continue;
        }

        if (Number.isFinite(numericLimit) && numericLimit > maxLimit) {
            const firstLimit = node.limit.value[0];

            if (firstLimit) firstLimit.value = maxLimit;
        }
    }

    return restoreSqlIdentifiers(parser.sqlify(ast, { database: 'Postgresql' }), prepared.placeholderMap);
}
