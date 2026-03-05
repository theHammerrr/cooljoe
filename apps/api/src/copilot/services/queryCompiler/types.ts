import { z } from 'zod';

export const SelectSubtreeSchema = z.object({
    table: z.string(),
    column: z.string(),
    agg: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional(),
    alias: z.string().optional()
});

export const JoinSubtreeSchema = z.object({
    fromTable: z.string(),
    fromColumn: z.string(),
    toTable: z.string(),
    toColumn: z.string(),
    type: z.enum(['inner', 'left', 'right']).default('inner')
});

export const FilterSubtreeSchema = z.object({
    table: z.string(),
    column: z.string(),
    op: z.enum(['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE', 'IN']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))])
});

export const GroupBySubtreeSchema = z.object({
    table: z.string(),
    column: z.string()
});

export const OrderBySubtreeSchema = z.object({
    table: z.string(),
    column: z.string(),
    dir: z.enum(['asc', 'desc']).default('asc')
});

export const SemanticQueryPlanSchema = z.object({
    intent: z.string().default(''),
    assumptions: z.array(z.string()).default([]),
    requires_raw_sql: z.boolean().default(false),
    raw_sql_fallback: z.string().optional(),
    select: z.array(SelectSubtreeSchema),
    joins: z.array(JoinSubtreeSchema).optional(),
    filters: z.array(FilterSubtreeSchema).optional(),
    groupBy: z.array(GroupBySubtreeSchema).optional(),
    orderBy: z.array(OrderBySubtreeSchema).optional(),
    limit: z.number().max(100).default(100),
    riskFlags: z.array(z.string()).optional()
});

export type SemanticQueryPlan = z.infer<typeof SemanticQueryPlanSchema>;
export type SelectSubtree = z.infer<typeof SelectSubtreeSchema>;
export type JoinSubtree = z.infer<typeof JoinSubtreeSchema>;
export type FilterSubtree = z.infer<typeof Fi