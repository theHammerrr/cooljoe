import { TableCatalogRow } from './models';
import {
    buildClarificationQuestion,
    detectDimensions,
    detectExplicitMeasure,
    detectMentionedEntities,
    detectRankingLimit,
    detectTimeGrain,
    needsEntity
} from './intentSketchHeuristics';

export interface IntentSketch {
    entities: string[];
    asksForCount: boolean;
    asksForTopN: boolean;
    asksForTimeBucket: boolean;
    asksForTimeRange: boolean;
    timeGrain?: 'day' | 'week' | 'month' | 'year';
    rankingLimit?: number;
    explicitMeasure?: string;
    dimensions: string[];
    missing: string[];
    clarificationQuestion?: string;
}

export function buildIntentSketch(question: string, tableCatalog: TableCatalogRow[]): IntentSketch {
    const entities = detectMentionedEntities(question, tableCatalog);
    const asksForCount = /\b(count|how many|number of|total number of)\b/i.test(question);
    const asksForTopN = /\btop\s+\d+\b|\bhighest\b|\bmost\b|\bbest\b|\blargest\b/i.test(question);
    const asksForTimeBucket = /\bby month\b|\bmonthly\b|\bby day\b|\bdaily\b|\bby week\b|\bweekly\b|\bby year\b|\byearly\b/i.test(question);
    const asksForTimeRange = /\blast\s+\d+\s+(day|days|week|weeks|month|months|year|years)\b|\btoday\b|\byesterday\b|\bthis month\b|\bthis week\b|\bthis year\b/i.test(question);
    const timeGrain = detectTimeGrain(question);
    const rankingLimit = detectRankingLimit(question);
    const explicitMeasure = detectExplicitMeasure(question);
    const dimensions = detectDimensions(question);
    const missing: string[] = [];

    if (entities.length === 0 && needsEntity(question)) {
        missing.push('entity');
    }

    if (asksForTopN && !explicitMeasure && !/\bby\s+\w+/i.test(question)) {
        missing.push('measure');
    }

    if (asksForTimeBucket && !asksForCount && !explicitMeasure) {
        missing.push('measure');
    }

    return {
        entities,
        asksForCount,
        asksForTopN,
        asksForTimeBucket,
        asksForTimeRange,
        timeGrain,
        rankingLimit,
        explicitMeasure,
        dimensions,
        missing,
        clarificationQuestion: buildClarificationQuestion(missing, entities, question)
    };
}

export function requiresClarification(sketch: IntentSketch): boolean {
    return sketch.missing.length > 0;
}
