export interface ParsedSchemaTable {
    name: string;
    columns: string[];
}

export interface ParsedSchemaBlock {
    schema?: string;
    tables: ParsedSchemaTable[];
}

export function parseSchemaBlock(content: string): ParsedSchemaBlock | null {
    try {
        const parsed = JSON.parse(content);

        if (typeof parsed !== 'object' || parsed === null) return null;
        const tablesRaw = Reflect.get(parsed, 'tables');

        if (!Array.isArray(tablesRaw)) return null;
        const tables = tablesRaw.flatMap((table) => {
            if (typeof table !== 'object' || table === null) return [];
            const name = Reflect.get(table, 'name');
            const columnsRaw = Reflect.get(table, 'columns');

            if (typeof name !== 'string' || !Array.isArray(columnsRaw)) return [];
            const columns = columnsRaw.filter((column): column is string => typeof column === 'string');

            return [{ name, columns }];
        });

        if (tables.length === 0) return null;
        const schema = Reflect.get(parsed, 'schema');

        return {
            schema: typeof schema === 'string' ? schema : undefined,
            tables
        };
    } catch {
        return null;
    }
}
