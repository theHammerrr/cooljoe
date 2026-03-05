export function buildRepairConstraints(
    constraints: unknown,
    validationErrors: string[],
    validationHints: string[],
    previousDraftSql: string,
    strict = false
): string {
    const base = strict
        ? ['Regenerate from scratch strictly adhering to the JSON schema.']
        : ['Fix the schema so all aliases referenced in SELECT/WHERE/ON appear in FROM/JOIN.'];

    return [
        constraints,
        ...base,
        ...validationErrors.map((issue) => `Validation issue: ${issue}`),
        ...validationHints,
        previousDraftSql ? `Previous generated SQL:\n${previousDraftSql}` : ''
    ].filter(Boolean).join('\n');
}
