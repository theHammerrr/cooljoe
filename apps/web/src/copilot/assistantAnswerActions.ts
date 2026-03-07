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
    const extractedPrisma = extractCodeBlock(messageText, PRISMA_BLOCK_PATTERN);

    if (extractedPrisma) {
        return {
            suggestedDraft: {
                question,
                mode: 'prisma',
                reason: 'Regenerate and validate a Prisma draft using this answer as a high-confidence hint.',
                constraints: buildAnswerHintConstraints('prisma', messageText, extractedPrisma),
                ctaLabel: 'Create Draft',
                tooltip: 'Regenerate and validate a draft using this answer as a hint. Slower, but safer when the answer is partial or uncertain.'
            },
            suggestedInjection: {
                mode: 'prisma',
                prisma: extractedPrisma,
                reason: 'Assistant answer already includes a usable Prisma-shaped query.',
                ctaLabel: 'Inject Query',
                tooltip: 'Use the query from this answer directly. Fastest option. Best when the answer already looks correct.'
            }
        };
    }

    const extractedSql = extractCodeBlock(messageText, SQL_BLOCK_PATTERN) || extractInlineSql(messageText);

    if (!extractedSql) {
        return {};
    }

    return {
        suggestedDraft: {
            question,
            mode: 'sql',
            reason: 'Regenerate and validate a SQL draft using this answer as a high-confidence hint.',
            constraints: buildAnswerHintConstraints('sql', messageText, extractedSql),
            ctaLabel: 'Create Draft',
            tooltip: 'Regenerate and validate a draft using this answer as a hint. Slower, but safer when the answer is partial or uncertain.'
        },
        suggestedInjection: {
            mode: 'sql',
            sql: extractedSql,
            reason: 'Assistant answer already includes a usable SQL query.',
            ctaLabel: 'Inject Query',
            tooltip: 'Use the query from this answer directly. Fastest option. Best when the answer already looks correct.'
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

    return lines.slice(sqlStartIndex).join('\n');
}

function buildAnswerHintConstraints(mode: 'sql' | 'prisma', fullAnswer: string, candidate: string) {
    return [
        `The assistant already proposed a ${mode.toUpperCase()}-shaped answer in chat.`,
        'Use it as a high-confidence starting point if it matches schema and intent.',
        `Candidate ${mode.toUpperCase()}:\n${candidate}`,
        `Assistant answer:\n${fullAnswer}`
    ].join('\n\n');
}
