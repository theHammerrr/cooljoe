export interface PreparedSqlForParser {
    parserSql: string;
    placeholderMap: Map<string, string>;
}

const QUOTED_IDENTIFIER_PATTERN = /"((?:[^"]|"")+)"/g;

export function normalizeQuotedSchemaTableIdentifiers(sql: string): string {
    return sql.replace(/"([^"]+)\.([^"]+)"/g, '"$1"."$2"');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function prepareSqlForParser(sql: string): PreparedSqlForParser {
    const normalizedSql = normalizeQuotedSchemaTableIdentifiers(sql);
    const placeholderMap = new Map<string, string>();
    let identifierIndex = 0;
    const parserSql = normalizedSql.replace(QUOTED_IDENTIFIER_PATTERN, (_match, rawIdentifier: string) => {
        const placeholder = `cooljoe_ident_${identifierIndex++}`;
        const identifier = rawIdentifier.replace(/""/g, '"');

        placeholderMap.set(placeholder, identifier);

        return placeholder;
    });

    return { parserSql, placeholderMap };
}

export function restoreIdentifierToken(value: string, placeholderMap: Map<string, string>): string {
    return placeholderMap.get(value) || value;
}

export function restoreSqlIdentifiers(sql: string, placeholderMap: Map<string, string>): string {
    let restored = sql;

    for (const [placeholder, identifier] of placeholderMap.entries()) {
        const escapedPlaceholder = escapeRegExp(placeholder);
        const quotedIdentifier = `"${identifier.replace(/"/g, '""')}"`;

        restored = restored.replace(new RegExp(`"${escapedPlaceholder}"`, 'g'), quotedIdentifier);
        restored = restored.replace(new RegExp(`\\b${escapedPlaceholder}\\b`, 'g'), quotedIdentifier);
    }

    return restored;
}
