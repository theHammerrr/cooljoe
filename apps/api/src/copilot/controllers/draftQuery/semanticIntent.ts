export function asksForNames(question: string): boolean {
    return /\b(name|names|first name|last name)\b/i.test(question);
}

export function asksForCount(question: string): boolean {
    return /\b(count|how many|number of|total number of)\b/i.test(question);
}

export function asksForTopN(question: string): boolean {
    return /\btop\s+\d+\b|\bhighest\b|\bmost\b|\bbest\b|\blargest\b/i.test(question);
}

export function asksForTimeBucket(question: string): boolean {
    return /\bby month\b|\bmonthly\b|\bby day\b|\bdaily\b|\bby week\b|\bweekly\b|\bby year\b|\byearly\b/i.test(question);
}

export function asksForTimeRange(question: string): boolean {
    return /\blast\s+\d+\s+(day|days|week|weeks|month|months|year|years)\b|\btoday\b|\byesterday\b|\bthis month\b|\bthis week\b|\bthis year\b/i.test(question);
}

export function hasAggregation(sql: string): boolean {
    return /\bcount\s*\(|\bsum\s*\(|\bavg\s*\(|\bmin\s*\(|\bmax\s*\(/i.test(sql);
}

export function hasOrderBy(sql: string): boolean {
    return /\border\s+by\b/i.test(sql);
}

export function hasLimit(sql: string): boolean {
    return /\blimit\s+\d+\b/i.test(sql);
}

export function hasTimeBucket(sql: string): boolean {
    return /\bdate_trunc\s*\(|\bextract\s*\(|\bto_char\s*\(|\bgroup\s+by\b.*(date|day|week|month|year)/i.test(sql);
}

export function hasTimeFilter(sql: string): boolean {
    return /\bwhere\b.*(date|time|created_at|updated_at|timestamp)|\bcurrent_date\b|\bnow\s*\(\)|\binterval\b/i.test(sql);
}
