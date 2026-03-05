/* eslint-disable max-lines */
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

function normalizeQuotedSchemaTableIdentifiers(sql: string): string {
    return sql.replace(/"([^"]+)\.([^"]+)"/g, '"$1"."$2"');
}

function addAliasesToSelectNode(selectNode: any): void {
    if (!Array.isArray(selectNode.from)) {
        return;
    }

    const tableAliasMap = new Map<string, string>();
    let aliasCounter = 1;

    for (const fromEntry of selectNode.from) {
        if (!fromEntry || typeof fromEntry !== 'object') {
            continue;
        }

        const tableName = typeof fromEntry.table === 'string' ? fromEntry.table : '';
        if (!tableName) {
            continue;
        }

        const schemaName = typeof fromEntry.db === 'string' ? fromEntry.db : '';
        const canonicalTable = schemaName ? `${schemaName}.${tableName}` : tableName;
        const existingAlias = typeof fromEntry.as === 'string' && fromEntry.as ? fromEntry.as : '';
        const alias = existingAlias || `t${aliasCounter++}`;

        fromEntry.as = alias;
        tableAliasMap.set(canonicalTable.toLowerCase(), alias);
        tableAliasMap.set(tableName.toLowerCase(), alias);
    }

    const rewriteColumnRefs = (node: any, isRoot = false): void => {
        if (Array.isArray(node)) {
            for (const child of node) {
                rewriteColumnRefs(child);
            }
            return;
        }

        if (!node || typeof node !== 'object') {
            return;
        }

        if (!isRoot && node.type === 'select') {
            addAliasesToSelectNode(node);
            return;
        }

        if (node.type === 'column_ref' && typeof node.table === 'string') {
            const tableName = node.table;
            const schemaName = typeof node.schema === 'string' ? node.schema : '';
            const canonicalTable = schemaName ? `${schemaName}.${tableName}` : tableName;
            const alias = tableAliasMap.get(canonicalTable.toLowerCase()) || tableAliasMap.get(tableName.toLowerCase());

            if (alias) {
                node.table = alias;
                node.schema = null;
            }
        }

        for (const value of Object.values(node)) {
            rewriteColumnRefs(value);
        }
    };

    rewriteColumnRefs(selectNode, true);
}

function normalizeSelectAliases(astNodes: any[]): void {
    for (const node of astNodes) {
        if (node && typeof node === 'object' && node.type === 'select') {
            addAliasesToSelectNode(node);
        }
    }
}

export function validateAndFormatQuery(sql: string, allowlist: string[], maxLimit = 100): string {
    const normalizedSql = normalizeQuotedSchemaTableIdentifiers(sql);

    // Parse AST
    let ast;
    let tableList;
    try {
        ast = parser.astify(normalizedSql, { database: 'Postgresql' });
        tableList = parser.tableList(normalizedSql);
    } catch (error: unknown) {
        const parseMessage = error instanceof Error ? error.message : 'Unknown Parser Error';
        throw new SQLSyntaxError(parseMessage);
    }

    const astArray = Array.isArray(ast) ? ast : [ast];
    normalizeSelectAliases(astArray);

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
