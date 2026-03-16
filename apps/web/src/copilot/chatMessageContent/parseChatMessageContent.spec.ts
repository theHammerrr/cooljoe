import { describe, expect, it } from 'vitest';
import { parseChatMessageContent } from './parseChatMessageContent';

describe('parseChatMessageContent', () => {
    it('parses fenced schema blocks into schema segments', () => {
        const segments = parseChatMessageContent(`
Here is the public schema.

\`\`\`schema
{"schema":"public","tables":[{"name":"PEOPLE","columns":["ID","firstName"]}]}
\`\`\`
        `);

        expect(segments).toHaveLength(2);
        expect(segments[0]).toEqual({ type: 'text', content: '\nHere is the public schema.\n\n' });
        expect(segments[1]).toEqual({
            type: 'schema',
            content: '{"schema":"public","tables":[{"name":"PEOPLE","columns":["ID","firstName"]}]}',
            value: {
                schema: 'public',
                tables: [{ name: 'PEOPLE', columns: ['ID', 'firstName'] }]
            }
        });
    });
});
