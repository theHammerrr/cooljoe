export function toValidationIssues(issues: { path: PropertyKey[]; message: string }[]): string[] {
    return issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`);
}
