export interface AstTableRef {
    table?: string;
    db?: string;
    as?: string;
}

export interface AstStatementBase {
    type?: string;
}

export interface AstSelectStatement extends AstStatementBase {
    type: 'select';
    from?: AstTableRef[];
    limit?: {
        seperator?: string;
        value?: Array<{ type?: string; value?: number }>;
    };
}

export type AstStatement = AstSelectStatement | AstStatementBase;

export function isAstObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function isAstSelectStatement(value: unknown): value is AstSelectStatement {
    if (!isAstObject(value)) {
        return false;
    }
    return Reflect.get(value, 'type') === 'select';
}

export function toAstStatementArray(ast: unknown): AstStatement[] {
    if (Array.isArray(ast)) {
        const out: AstStatement[] = [];
        for (const item of ast) {
            if (isAstObject(item)) {
                out.push(item);
            }
        }
        return out;
    }
    if (isAstObject(ast)) {
        return [ast];
    }
    return [];
}
