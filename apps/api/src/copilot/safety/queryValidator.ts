/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parser } from 'node-sql-parser';

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

function collectTablesFromSelectNode(selectNode: any, out: Set<string>): void {
    const fromClause = selectNode?.from;
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

function extractTablesFromAst(astNodes: any[]): string[] {
    const tables = new Set<string>();

    for (const node of astNodes) {
        if (node && typeof node === 'object' && node.type === 'select') {
            collectTablesFromSelectNode(node, tables);
        }
    }

    return Array.from(tables);
}

export function validateAndFormatQuery(sql: string, allowlist: string[], maxLimit = 100): string {
    const normalizedSql = normalizeQuotedSchemaTableIdentifiers(sql);

    // Parse AST
    let ast;
    try {
        ast = parser.astify(normalizedSql, { database: 'Postgresql' });
    } catch (error: unknown) {
        const parseMessage = error instanceof Error ? error.message : 'Unknown Parser Error';
        throw new SQLSyntaxError(parseMessage);
    }

    const astArray = Array.isArray(ast) ? ast : [ast];
    const tableList = extractTablesFromAst(astArray);

    // 2. Allowlist Enforcement
    for (const tableStr of tableList) {
        // tableStr usually comes out as "db::table", "table", or "crud::db::table"
        const parts = tableStr.split('::');
        const tableName = parts[parts.length - 1];

        if (!allowlist.includes(tableName.toLowerCase())) {
            throw new DisallowedTableError(tableName);
        }
    }

    // 1. Block non-SELECT statements and inject limits
    for (const node of astArray) {
        if (node.type !== 'select') {
            throw new DisallowedStatementError(node.type);
        }

        // 3. Limit Injection Constraints
        if (!node.limit || !node.limit.value || node.limit.value.length === 0) {
            // Create a default limit if not present
            node.limit = {
                seperator: '',
                value: [{ type: 'number', value: maxLimit }]
            };
        } else {
            // If limit exists, cap it without exceeding maxLimit
            const currentLimit = node.limit.value[0].value;
            if (currentLimit > maxLimit) {
                node.limit.value[0].value = maxLimit;
            }
        }
    }

    // Stringify the modified AST back to safely constructed SQL
    return parser.sqlify(astArray, { database: 'Postgresql' });
}
