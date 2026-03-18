import { parseSchemaBlock, type ParsedSchemaBlock } from './parseSchemaBlock';

export type ChatMessageSegment =
    | { type: 'text'; content: string }
    | { type: 'query'; content: string; language: 'sql' | 'prisma' | 'code' }
    | { type: 'schema'; content: string; value: ParsedSchemaBlock };

const FENCED_BLOCK_PATTERN = /```(schema|sql|prisma|ts|typescript|js|javascript)?\s*([\s\S]*?)```/gi;
const INLINE_SQL_PATTERN = /(^|\n)((?:with|select)\b[\s\S]*)/i;
const INLINE_PRISMA_PATTERN = /(^|\n)((?:const\s+\w+\s*=\s*)?\w*\.?findMany\([\s\S]*|prisma\.\w+[\s\S]*)/i;

type FencedBlockLanguage = 'schema' | 'sql' | 'prisma' | 'code';
type QueryLanguage = Extract<FencedBlockLanguage, 'sql' | 'prisma' | 'code'>;

export function parseChatMessageContent(text: string): ChatMessageSegment[] {
    if (!text.trim()) {
        return [{ type: 'text', content: text }];
    }

    const fencedSegments = parseFencedBlocks(text);

    if (fencedSegments.length > 0) {
        return fencedSegments;
    }

    const inlinePrismaMatch = text.match(INLINE_PRISMA_PATTERN);

    if (inlinePrismaMatch?.index != null) {
        return splitInlineQuery(text, inlinePrismaMatch.index + inlinePrismaMatch[1].length, 'prisma');
    }

    const inlineSqlMatch = text.match(INLINE_SQL_PATTERN);

    if (inlineSqlMatch?.index != null) {
        return splitInlineQuery(text, inlineSqlMatch.index + inlineSqlMatch[1].length, 'sql');
    }

    return [{ type: 'text', content: text }];
}

function parseFencedBlocks(text: string): ChatMessageSegment[] {
    const segments: ChatMessageSegment[] = [];
    let lastIndex = 0;
    let match = FENCED_BLOCK_PATTERN.exec(text);

    while (match) {
        const matchIndex = match.index;
        const fullMatch = match[0];
        const languageHint = normalizeLanguage(match[1]);
        const code = match[2]?.trim() || '';

        if (matchIndex > lastIndex) {
            segments.push({ type: 'text', content: text.slice(lastIndex, matchIndex) });
        }

        if (code) {
            segments.push(buildFencedSegment(languageHint, code));
        }

        lastIndex = matchIndex + fullMatch.length;
        match = FENCED_BLOCK_PATTERN.exec(text);
    }

    if (lastIndex < text.length) {
        segments.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return compactSegments(segments);
}

function splitInlineQuery(text: string, queryStartIndex: number, language: 'sql' | 'prisma'): ChatMessageSegment[] {
    const before = text.slice(0, queryStartIndex);
    const query = text.slice(queryStartIndex).trim();

    return compactSegments([
        { type: 'text', content: before },
        { type: 'query', content: query, language }
    ]);
}

function compactSegments(segments: ChatMessageSegment[]) {
    return segments.filter((segment) => segment.content.trim().length > 0);
}

function buildFencedSegment(language: FencedBlockLanguage, content: string): ChatMessageSegment {
    if (language === 'schema') {
        const parsedSchema = parseSchemaBlock(content);

        if (parsedSchema) {
            return { type: 'schema', content, value: parsedSchema };
        }
    }

    return { type: 'query', content, language: toQueryLanguage(language) };
}

function toQueryLanguage(language: FencedBlockLanguage): QueryLanguage {
    if (language === 'sql' || language === 'prisma') {
        return language;
    }

    return 'code';
}

function normalizeLanguage(value: string | undefined): FencedBlockLanguage {
    if (!value) {
        return 'code';
    }

    const normalized = value.toLowerCase();

    if (normalized === 'schema') {
        return 'schema';
    }

    if (normalized === 'sql') {
        return 'sql';
    }

    if (normalized === 'prisma' || normalized === 'ts' || normalized === 'typescript' || normalized === 'js' || normalized === 'javascript') {
        return 'prisma';
    }

    return 'code';
}
