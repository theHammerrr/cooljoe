import type { CopilotMessage } from './types';

const SQL_BLOCK_PATTERN = /```sql\s*([\s\S]*?)```/i;
const PRISMA_BLOCK_PATTERN = /```(?:ts|typescript|js|javascript|prisma)?\s*([\s\S]*?findMany[\s\S]*?)```/i;

interface AssistantAnswerActions {
    suggestedDraft?: CopilotMessage['suggestedDraft'];
    suggestedInjection?: CopilotMessage['suggestedInjection'];
}

export function buildAssistantAnswerActions(
    question: string,
    messageText: string
): AssistantAnswerActions {
    const extractedSql = extractCodeBlock(messageText, SQL_BLOCK_PATTERN) || extractInlineSql(messageText);

    if (extractedSql) {
        return {
            suggestedDraft: {
                question,
                mode: 'sql',
                reason: 'Regenerate and validate a SQL draft using this answer as a high-confidence hint.',
                constraints: buildAnswerHintConstraints('sql', extractedSql),
                ctaLabel: 'Create Draft',
                tooltip: 'Regenerate and validate a draft using this answer as a hint. Slower, but safer when the answer already looks close.'
            },
            suggestedInjection: {
                mode: 'sql',
                sql: extractedSql,
                reason: 'Assistant answer already includes a usable SQL query.',
                ctaLabel: 'Inject Query',
                tooltip: 'Use the SQL query from this answer directly.'
            }
        };
    }

    const extractedPrisma = extractCodeBlock(messageText, PRISMA_BLOCK_PATTERN);

    if (!extractedPrisma) {
        return {};
    }

    return {
        suggestedDraft: {
            question,
            mode: 'prisma',
            reason: 'Regenerate and validate a Prisma draft using this answer as a high-confidence hint.',
            constraints: buildAnswerHintConstraints('prisma', extractedPrisma),
            ctaLabel: 'Create Draft',
            tooltip: 'Regenerate and validate a draft using this answer as a hint. Slower, but safer when the answer already looks close.'
        },
        suggestedInjection: {
            mode: 'prisma',
            prisma: extractedPrisma,
            reason: 'Assistant answer already includes a usable Prisma-shaped query.',
            ctaLabel: 'Inject Query',
            tooltip: 'Use the Prisma query from this answer directly.'
        }
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
