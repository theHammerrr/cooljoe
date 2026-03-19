import { SuggestedDraft } from '../intentRouter';

const SQL_BLOCK_PATTERN = /```sql\s*([\s\S]*?)```/i;
const PRISMA_BLOCK_PATTERN = /```(?:ts|typescript|js|javascript|prisma)?\s*([\s\S]*?findMany[\s\S]*?)```/i;

export function resolveSuggestedDraftFromAnswer(prompt: string, messageText: string): SuggestedDraft | null {
    const extractedSql = extractCodeBlock(messageText, SQL_BLOCK_PATTERN) || extractInlineSql(messageText);

    if (extractedSql) {
        return {
            question: prompt,
            mode: 'sql',
            reason: 'Assistant answer already includes a SQL-shaped query. Reuse it as a drafting hint.',
            constraints: buildAnswerHintConstraints('sql', extractedSql),
            ctaLabel: 'Create Draft From Answer'
        };
    }

    const extractedPrisma = extractCodeBlock(messageText, PRISMA_BLOCK_PATTERN);

    if (!extractedPrisma) return null;

    return {
        question: prompt,
        mode: 'prisma',
        reason: 'Assistant answer already includes a Prisma-shaped query. Reuse it as a drafting hint.',
        constraints: buildAnswerHintConstraints('prisma', extractedPrisma),
        ctaLabel: 'Create Draft From Answer'
    };
}

function extractCodeBlock(value: string, pattern: RegExp): string | undefined {
    const match = value.match(pattern);
    const extracted = match?.[1]?.trim();

    return extracted || undefined;
}

function extractInlineSql(value: string): string | undefined {
    const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
    const sqlStartIndex = lines.findIndex((line) => /^(select|with)\b/i.test(line));

    if (sqlStartIndex < 0) return undefined;

    const sqlLines: string[] = [];

    for (const line of lines.slice(sqlStartIndex)) {
        if (/^```/.test(line)) break;

        if (/^prisma\./i.test(line)) break;

        sqlLines.push(line);
    }

    return sqlLines.join('\n').trim() || undefined;
}

function buildAnswerHintConstraints(mode: 'sql' | 'prisma', candidate: string) {
    return [
        `The assistant already proposed a ${mode.toUpperCase()}-shaped answer in chat.`,
        'Use it as a high-confidence starting point if it matches schema and intent.',
        `Candidate ${mode.toUpperCase()}:\n${candidate}`
    ].join('\n\n');
}
