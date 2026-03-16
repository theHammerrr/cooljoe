import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { KnowledgeImportResult, NormalizedKnowledgeEntry } from './types';

const jsonEntrySchema = z.object({ type: z.string(), term: z.string(), definition: z.string(), metadata: z.record(z.string(), z.unknown()).optional() });

export async function loadKnowledgeEntriesFromDirectory(directory: string): Promise<KnowledgeImportResult & { entries: NormalizedKnowledgeEntry[] }> {
    const files = await listKnowledgeFiles(directory);
    const entries: NormalizedKnowledgeEntry[] = [];
    const errors: string[] = [];

    for (const file of files) {
        try {
            entries.push(...parseKnowledgeFile(file, directory));
        } catch (error) {
            errors.push(`${path.relative(directory, file)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return { imported: 0, updated: 0, skipped: 0, files, errors, entries };
}

async function listKnowledgeFiles(directory: string): Promise<string[]> {
    if (!fs.existsSync(directory)) return [];
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) return listKnowledgeFiles(fullPath);

        return /\.(md|json)$/i.test(entry.name) ? [fullPath] : [];
    }));

    return files.flat().sort();
}

function parseKnowledgeFile(file: string, rootDir: string): NormalizedKnowledgeEntry[] {
    const content = fs.readFileSync(file, 'utf8');

    return file.endsWith('.json') ? parseJsonKnowledgeFile(content, file, rootDir) : parseMarkdownKnowledgeFile(content, file, rootDir);
}

function parseJsonKnowledgeFile(content: string, file: string, rootDir: string): NormalizedKnowledgeEntry[] {
    const parsed = JSON.parse(content);
    const records = Array.isArray(parsed) ? parsed : [parsed];

    return records.map((record, index) => toKnowledgeEntry(jsonEntrySchema.parse(record), file, rootDir, index));
}

function parseMarkdownKnowledgeFile(content: string, file: string, rootDir: string): NormalizedKnowledgeEntry[] {
    const { frontmatter, body } = splitFrontmatter(content);
    const definition = body.trim();

    if (!definition) throw new Error('Markdown knowledge files need body content.');

    return [{ type: readFrontmatterString(frontmatter.type) || 'glossary', term: readFrontmatterString(frontmatter.term) || path.basename(file, path.extname(file)), definition, metadata: { ...frontmatter, source: 'file', path: path.relative(rootDir, file) }, source: 'file', sourceKey: `file:${path.relative(rootDir, file)}` }];
}

function splitFrontmatter(content: string) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

    return match ? { frontmatter: parseFrontmatter(match[1]), body: match[2] } : { frontmatter: {}, body: content };
}

function parseFrontmatter(input: string): Record<string, unknown> {
    return Object.fromEntries(input.split(/\r?\n/).flatMap((line) => {
        const separatorIndex = line.indexOf(':');

        if (separatorIndex <= 0) return [];

        return [[line.slice(0, separatorIndex).trim(), parseFrontmatterValue(line.slice(separatorIndex + 1).trim())]];
    }));
}

function parseFrontmatterValue(value: string): unknown {
    if (value.startsWith('[') && value.endsWith(']')) return parseFrontmatterArray(value);

    if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';

    if (/^\d+(\.\d+)?$/.test(value)) return Number(value);

    return stripQuotes(value);
}

function parseFrontmatterArray(value: string): unknown[] {
    try {
        const parsed = JSON.parse(value);

        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return value.slice(1, -1).split(',').map((item) => stripQuotes(item.trim())).filter(Boolean);
    }
}

function stripQuotes(value: string): string { return value.replace(/^['"]|['"]$/g, ''); }
function readFrontmatterString(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function toKnowledgeEntry(record: z.infer<typeof jsonEntrySchema>, file: string, rootDir: string, index: number): NormalizedKnowledgeEntry {
    return { ...record, metadata: { ...(record.metadata || {}), source: 'file', path: path.relative(rootDir, file) }, source: 'file', sourceKey: `file:${path.relative(rootDir, file)}#${index}` };
}
