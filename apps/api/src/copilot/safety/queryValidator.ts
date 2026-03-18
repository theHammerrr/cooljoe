import { AST, Parser } from 'node-sql-parser';
import { AstSelectStatement, isAstSelectStatement, toAstStatementArray } from './sqlAstTypes';

const parser = new Parser();

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

export function normalizeQuotedSchemaTableIdentifiers(sql: string): string {
    return sql.replace(/"([^"]+)\.([^"]+)"/g, '"$1"."$2"');
}

function collectTablesFromSelectNode(selectNode: AstSelectStatement, out: Set<string>): void {
    const fromClause = selectNode.from;

    if (!Array.isArray(fromClause)) {
        return;
    }

    for (const fromEntry of fromClause) {
        if (!fromEntry || typeof fromEntry !== 'object') {
            continue;
        }

        if (typeof fromEntry.table === 'string' && fromEntry.table) {
            out.add(fromEntry.table.toLowerCase());
        }
    }
}

function extractTablesFromAst(astNodes: unknown[]): string[] {
    const tables = new Set<string>();

    for (const node of astNodes) {
        if (isAstSelectStatement(node)) {
            collectTablesFromSelectNode(node, tables);
        }
    }

    return Array.from(tables);
}

export function parseQueryAst(sql: string): AST | AST[] {
    const normalizedSql = normalizeQuotedSchemaTableIdentifiers(sql);

    try {
        return parser.astify(normalizedSql, { database: 'Postgresql' });
    } catch (error: unknown) {
        const parseMessage = error instanceof Error ? error.message : 'Unknown Parser Error';
        throw new SQLSyntaxError(parseMessage);
    }
}

export function extractReferencedTablesFromQuery(sql: string): string[] {
    const ast = parseQueryAst(sql);

    return extractTablesFromAst(toAstStatementArray(ast));
}

export function validateAndFormatQuery(
    sql: string,
    allowlist: string[],
    maxLimit = 100,
    options: { enforceAllowlist?: boolean } = {}
): string {
    const ast = parseQueryAst(sql);
    const astArray = toAstStatementArray(ast);
    const tableList = extractTablesFromAst(astArray);

    if (options.enforceAllowlist !== false) {
        for (const tableStr of tableList) {
            const parts = tableStr.split('::');
            const tableName = parts[parts.length - 1];

            if (!allowlist.includes(tableName.toLowerCase())) {
                throw new DisallowedTableError(tableName);
            }
        }
    }

    for (const node of astArray) {
        if (!isAstSelectStatement(node)) {
            throw new DisallowedStatementError(typeof node.type === 'string' ? node.type : 'unknown');
        }

        if (!node.limit || !node.limit.value || node.limit.value.length === 0) {
            node.limit = { seperator: '', value: [{ type: 'number', value: maxLimit }] };
        } else {
            const currentLimit = node.limit.value[0]?.value;

            if (typeof currentLimit === 'number' && currentLimit > maxLimit) {
                node.limit.value[0].value = maxLimit;
            }
        }
    }

    return parser.sqlify(ast, { database: 'Postgresql' });
}
