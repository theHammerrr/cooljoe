import { classNameForPrismaToken, classNameForSqlToken } from './queryHighlightStyles';

const SQL_KEYWORD_PATTERN = /\b(select|from|where|join|left|right|inner|outer|full|on|group|by|order|limit|offset|having|with|as|and|or|not|in|is|null|case|when|then|else|end|distinct|count|sum|avg|min|max|union|all|desc|asc)\b/gi;
const PRISMA_KEYWORD_PATTERN = /\b(const|let|return|await|where|select|include|orderBy|groupBy|take|skip|by|equals|contains|startsWith|endsWith|some|every|none)\b/g;

export function tokenizeQueryLine(line: string, language: 'sql' | 'prisma' | 'code') {
    if (language === 'sql') {
        return tokenizeSqlLine(line);
    }

    if (language === 'prisma') {
        return tokenizePrismaLine(line);
    }

    return [{ value: line, className: '' }];
}

function tokenizeSqlLine(line: string) {
    const tokens: Array<{ value: string; className: string }> = [];
    let cursor = 0;

    while (cursor < line.length) {
        const commentIndex = line.indexOf('--', cursor);

        if (commentIndex === cursor) {
            tokens.push({ value: line.slice(cursor), className: 'text-slate-500 italic' });

            return tokens;
        }

        const nextToken = findEarliestMatch(line, cursor, [
            /"[^"]*"/g,
            /'[^']*'/g,
            /\b\d+(?:\.\d+)?\b/g,
            SQL_KEYWORD_PATTERN
        ]);

        if (!nextToken) {
            tokens.push({ value: line.slice(cursor), className: '' });

            return tokens;
        }

        pushGap(tokens, line, cursor, nextToken.index);
        tokens.push({ value: nextToken.value, className: classNameForSqlToken(nextToken.value) });
        cursor = nextToken.index + nextToken.value.length;
    }

    return tokens;
}

function tokenizePrismaLine(line: string) {
    const tokens: Array<{ value: string; className: string }> = [];
    let cursor = 0;

    while (cursor < line.length) {
        const nextToken = findEarliestMatch(line, cursor, [
            /"[^"]*"/g,
            /'[^']*'/g,
            /\b\d+(?:\.\d+)?\b/g,
            /\bprisma\b/g,
            /\bfindMany\b/g,
            /\bfindFirst\b/g,
            /\bfindUnique\b/g,
            PRISMA_KEYWORD_PATTERN
        ]);

        if (!nextToken) {
            tokens.push({ value: line.slice(cursor), className: '' });

            return tokens;
        }

        pushGap(tokens, line, cursor, nextToken.index);
        tokens.push({ value: nextToken.value, className: classNameForPrismaToken(nextToken.value) });
        cursor = nextToken.index + nextToken.value.length;
    }

    return tokens;
}

function pushGap(tokens: Array<{ value: string; className: string }>, line: string, cursor: number, nextIndex: number) {
    if (nextIndex > cursor) {
        tokens.push({ value: line.slice(cursor, nextIndex), className: '' });
    }
}

function findEarliestMatch(line: string, cursor: number, patterns: RegExp[]) {
    let earliestMatch: { index: number; value: string } | null = null;

    for (const pattern of patterns) {
        pattern.lastIndex = cursor;
        const match = pattern.exec(line);

        if (!match?.[0]) {
            continue;
        }

        if (!earliestMatch || match.index < earliestMatch.index) {
            earliestMatch = { index: match.index, value: match[0] };
        }
    }

    return earliestMatch;
}
