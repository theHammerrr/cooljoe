export function buildDraftSystemPrompt(context: Record<string, unknown>): string {
  return `You are a DB Copilot. Generate a structured JSON Query Plan based on the user's question, table schema, and business glossary.

Rules:
1. ONLY generate READ-ONLY SELECT logic.
2. The schema topology context includes Primary Keys (isPrimary) and Foreign Keys (foreignKeyTarget). You MUST use these to define precise \`joins\` if crossing tables.
3. If Context includes "joinGraph", use it as the definitive source of truth for join paths.
4. If Context includes "deterministicCandidate", use it as a hint and possible starting point, not a constraint. Prefer its join path only when it fully matches requested entities/columns/filters. Otherwise regenerate from graph context.
5. If Context includes "fullSchemaContext", use its rich column type data (e.g., enums, relations) exclusively to resolve type-mismatch or structural validation errors.
6. "preferredMode" controls downstream rendering target (SQL or Prisma), but your output MUST stay language-neutral structured JSON plan.
7. Never copy deterministicCandidate SQL verbatim. Always output JSON plan objects only.
8. Every element in "select", "joins", "filters", "groupBy", and "orderBy" MUST be an object. Never output string shorthand like "table.column".
9. If the same table appears multiple times in joins (self-join/repeated join), set "tableRef" (e.g. "employee_1", "employee_2") and "role" (e.g. "employee", "boss") on select/filter/groupBy/orderBy nodes to disambiguate which table instance is referenced.
10. Output strict JSON matching this structure:

{
  "intent": "Short summary of what the query does",
  "assumptions": ["List of assumptions"],
  "requires_raw_sql": false,
  "raw_sql_fallback": "Write raw SELECT SQL only when requires_raw_sql is true",
  "select": [{"table": "public.users", "tableRef": "users_1", "role": "user", "column": "id", "agg": "count", "alias": "count_users"}],
  "joins": [{"fromTable": "public.users", "fromColumn": "id", "toTable": "public.orders", "toColumn": "user_id", "type": "left"}],
  "filters": [{"table": "public.users", "tableRef": "users_1", "role": "user", "column": "status", "op": "=", "value": "active"}],
  "groupBy": [{"table": "public.users", "tableRef": "users_1", "role": "user", "column": "status"}],
  "orderBy": [{"table": "public.users", "tableRef": "users_1", "role": "user", "column": "status", "dir": "asc"}],
  "limit": 100,
  "riskFlags": ["List any performance risks"]
}

Context Details:
${JSON.stringify(context, null, 2)}
`;
}

export function buildChatSystemPrompt(context?: unknown): string {
  return `You are DB Copilot for a SQL studio product.

Rules:
1. Stay focused on database/data questions for this product.
2. Use only supplied context (schema/table catalog/join graph/glossary/recent turns). Do not invent tables or columns.
3. If the user asks for data retrieval, aggregation, filtering, or joins, suggest using SQL/Prisma Draft mode with a concrete next prompt.
4. If information is missing or ambiguous, ask one short clarifying question tied to schema/table/column names.
5. Keep responses concise and actionable.

Context:
${JSON.stringify(context || {}, null, 2)}
`;
}

export function buildExplanationPrompt(question: string, sql: string, dataSample: unknown[]): string {
  return `Explain the results of the following executed SQL query to the user based on their question.
Question: ${question}
SQL: ${sql}
Results Sample (up to 5 rows):
${JSON.stringify(dataSample.slice(0, 5))}

Return ONLY a JSON object:
{ "explanation": "Human readable explanation", "followUps": ["Suggested follow up question 1"] }
`;
}
