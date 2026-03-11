import { TableCatalogRow } from './models';
import { IntentSketch } from './intentSketch';
import { normalizeIdentifier } from './common';
import { detectSemanticColumnMatches } from './semanticColumnMatches';

const EXPLICIT_MEASURE_PATTERNS: Array<{ measure: string; pattern: RegExp }> = [
    { measure: 'revenue', pattern: /\b(revenue|sales amount|gmv|arr|mrr)\b/i },
    { measure: 'order_count', pattern: /\b(order count|orders)\b/i },
    { measure: 'count', pattern: /\b(count|how many|number of|total number of)\b/i },
    { measure: 'amount', pattern: /\b(amount|total amount|sum)\b/i }
];

export function detectMentionedEntities(question: string, tableCatalog: TableCatalogRow[]): string[] {
    const lowerQuestion = question.toLowerCase();

    return tableCatalog
        .map((row) => row.table)
        .filter((table) => {
            const bareTable = table.split('.').slice(-1)[0];
            const singular = bareTable.endsWith('s') ? bareTable.slice(0, -1) : bareTable;
            const plural = bareTable.endsWith('s') ? bareTable : `${bareTable}s`;

            return [bareTable, singular, plural].some((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(lowerQuestion));
        });
}

export function detectMentionedColumns(question: string, tableCatalog: TableCatalogRow[]): string[] {
    const normalizedQuestion = normalizeQuestion(question);
    const mentionedColumns = new Set<string>();

    for (const row of tableCatalog) {
        for (const column of row.columns) {
            const normalizedColumn = normalizeIdentifier(column);

            if (buildColumnMentionPattern(normalizedColumn).test(normalizedQuestion)) {
                mentionedColumns.add(normalizedColumn);
            }
        }

        for (const semanticColumn of detectSemanticColumnMatches(normalizedQuestion, row)) {
            mentionedColumns.add(semanticColumn);
        }
    }

    return Array.from(mentionedColumns);
}

export function detectExplicitMeasure(question: string): string | undefined {
    const matched = EXPLICIT_MEASURE_PATTERNS.find(({ pattern }) => pattern.test(question));

    return matched?.measure;
}

export function detectDimensions(question: string): string[] {
    const dimensions: string[] = [];

    if (/\bcustomer/i.test(question)) dimensions.push('customer');

    if (/\bproduct/i.test(question)) dimensions.push('product');

    if (/\bemployee/i.test(question)) dimensions.push('employee');

    if (/\bstatus\b/i.test(question)) dimensions.push('status');

    if (detectTimeGrain(question)) dimensions.push('time');

    return dimensions;
}

export function detectTimeGrain(question: string): IntentSketch['timeGrain'] {
    if (/\bby day\b|\bdaily\b/i.test(question)) return 'day';

    if (/\bby week\b|\bweekly\b/i.test(question)) return 'week';

    if (/\bby month\b|\bmonthly\b/i.test(question)) return 'month';

    if (/\bby year\b|\byearly\b/i.test(question)) return 'year';

    return undefined;
}

export function detectRankingLimit(question: string): number | undefined {
    const match = question.match(/\btop\s+(\d+)\b/i);

    if (!match) return undefined;

    const parsed = Number(match[1]);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function needsEntity(question: string): boolean {
    return /\b(show|list|get|retrieve|count|how many|top|highest|most|best|largest)\b/i.test(question);
}

export function buildClarificationQuestion(missing: string[], entities: string[], question: string): string | undefined {
    if (missing.includes('entity')) {
        return 'Which table or business entity do you want to query?';
    }

    if (missing.includes('measure')) {
        if (/\bcustomer/i.test(question)) {
            return 'Which metric should rank customers: revenue, order count, or something else?';
        }

        if (entities.length > 0) {
            return `Which metric do you want for ${entities[0]}?`;
        }

        return 'Which metric do you want to measure?';
    }

    return undefined;
}

function normalizeQuestion(question: string): string {
    return question
        .toLowerCase()
        .replace(/'s\b/g, ' ')
        .replace(/[^a-z0-9_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildColumnMentionPattern(normalizedColumn: string): RegExp {
    const escaped = normalizedColumn.replace(/_/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return new RegExp(`\\b${escaped}\\b`, 'i');
}
