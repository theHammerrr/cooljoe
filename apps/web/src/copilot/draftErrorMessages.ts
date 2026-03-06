function isJoinSemanticFailure(issue: string): boolean {
    return issue.includes('Invalid join relation');
}

export function formatDraftFailureMessage(issue: string): string {
    if (isJoinSemanticFailure(issue)) {
        return 'Invalid join path for role mapping. Expected employee -> employee(boss) -> person for boss attributes.';
    }

    return issue;
}
