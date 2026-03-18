interface QueryAnalysisOptimizationPromptInput {
    sql: string;
    findings: unknown[];
    rawPlan: unknown;
    indexes: unknown[];
    tableStats: unknown[];
    safetyNotes: string[];
    schema: unknown;
}

export function buildQueryAnalysisOptimizationPrompt(input: QueryAnalysisOptimizationPromptInput): string {
    return `You are a senior database performance engineer helping optimize a SQL query.

Rules:
1. Base your answer only on the supplied SQL, findings, execution plan, indexes, table stats, safety notes, and schema context.
2. You may suggest alternative indexes, query rewrites, predicate changes, join changes, and sort/aggregation improvements.
3. You are allowed to be exploratory, but never present ideas as guaranteed wins.
4. If evidence is weak or ambiguous, say so directly.
5. Prefer practical advice over textbook generalities.
6. Return ONLY valid JSON in this shape:
{
  "summary": "2-5 sentence optimization summary",
  "suggestions": ["Optimization idea 1", "Optimization idea 2", "Optimization idea 3"]
}

SQL:
${input.sql}

Structured Findings:
${JSON.stringify(input.findings, null, 2)}

Execution Plan:
${JSON.stringify(input.rawPlan, null, 2)}

Indexes:
${JSON.stringify(input.indexes, null, 2)}

Table Stats:
${JSON.stringify(input.tableStats, null, 2)}

Safety Notes:
${JSON.stringify(input.safetyNotes, null, 2)}

Schema Context:
${JSON.stringify(input.schema, null, 2)}
`;
}
