import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadKnowledgeEntriesFromDirectory } from './knowledgeFileParser';

const tempDirs: string[] = [];

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('knowledgeFileParser', () => {
    it('imports markdown knowledge files with frontmatter', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-md-'));

        tempDirs.push(dir);
        fs.writeFileSync(path.join(dir, 'rule.md'), `---\ntype: business_rule\nterm: public.users.deleted_at\ncolumn: deleted_at\n---\n1999 means not deleted.\n`);
        const result = await loadKnowledgeEntriesFromDirectory(dir);

        expect(result.errors).toEqual([]);
        expect(result.entries).toEqual([
            expect.objectContaining({
                type: 'business_rule',
                term: 'public.users.deleted_at',
                definition: '1999 means not deleted.',
                source: 'file'
            })
        ]);
    });

    it('imports json knowledge files', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-json-'));

        tempDirs.push(dir);
        fs.writeFileSync(path.join(dir, 'entries.json'), JSON.stringify([
            { type: 'glossary', term: 'county', definition: 'Supported counties are Israel and USA.' }
        ]));
        const result = await loadKnowledgeEntriesFromDirectory(dir);

        expect(result.errors).toEqual([]);
        expect(result.entries[0]).toEqual(expect.objectContaining({ term: 'county', type: 'glossary' }));
    });
});
