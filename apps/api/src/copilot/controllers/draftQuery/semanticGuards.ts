function normalizeSql(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

function asksForNames(question: string): boolean {
    return /\bname|names|first name|last name\b/i.test(question);
}

export function detectSemanticDraftIssue(
    question: string,
    sql: string,
    deterministicCandidate?: { confidence: number; sql: string }
): string | null {
    if (deterministicCandidate && deterministicCandidate.confidence < 0.75) {
        const generated = normalizeSql(sql);
        const candidate = normalizeSql(deterministicCandidate.sql);
        if (generated === candidate) {
            return 'Generated SQL echoed low-confidence deterministic candidate without resolving missing intent.';
        }
    }

    if (asksForNames(question)) {
        const normalized = normalizeSql(sql);
        const hasNameColumn = normalized.includes('first_name') || normalized.includes('last_name') || normalized.includes('"name"');
        const isWildcardEmployee = normalized.includes('"employee".*') || normalized.includes(' employee.*');
        if (isWildcardEmployee && !hasNameColumn) {
            return 'Prompt asks for names but SQL only selects employee.* without explicit name columns.';
        }
    }

    return null;
}
