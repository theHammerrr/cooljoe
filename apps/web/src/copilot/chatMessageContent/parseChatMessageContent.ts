export type ChatMessageSegment =
    | { type: 'text'; content: string }
    | { type: 'query'; content: string; language: 'sql' | 'prisma' | 'code' };

const FENCED_BLOCK_PATTERN = /```(sql|prisma|ts|typescript|js|javascript)?\s*([\s\S]*?)```/gi;
const INLINE_SQL_PATTERN = /(^|\n)((?:with|select)\b[\s\S]*)/i;
const INLINE_PRISMA_PATTERN = /(^|\n)((?:const\s+\w+\s*=\s*)?\w*\.?findMany\([\s\S]*|prisma\.\w+[\s\S]*)/i;

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
            segments.push({ type: 'query', content: code, language: languageHint });
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
    return segments.filter((segment) => segment.content.trim().length > 0 || segment.type === 'text');
}

function normalizeLanguage(value: string | undefined): 'sql' | 'prisma' | 'code' {
    if (!value) {
        return 'code';
    }

    const normalized = value.toLowerCase();

    if (normalized === 'sql') {
        return 'sql';
    }

    if (normalized === 'prisma' || normalized === 'ts' || normalized === 'typescript' || normalized === 'js' || normalized === 'javascript') {
        return 'prisma';
    }

    return 'code';
}
