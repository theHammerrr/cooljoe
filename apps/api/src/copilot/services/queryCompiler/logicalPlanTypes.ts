import { z } from 'zod';
import { LogicalDerivedOperationSchema } from './logicalDerivedOperations';

const LogicalFieldRefSchema = z.object({
    table: z.string(),
    column: z.string(),
    tableRef: z.string().optional(),
    role: z.string().optional(),
    alias: z.string().optional()
});

const LogicalMeasureSchema = LogicalFieldRefSchema.extend({
    agg: z.enum(['count', 'sum', 'avg', 'min', 'max'])
});

const LogicalRelationshipSchema = z.object({
    fromTable: z.string(),
    fromColumn: z.string(),
    toTable: z.string(),
    toColumn: z.string(),
    type: z.enum(['inner', 'left', 'right']).default('inner')
});

const LogicalFilterSchema = LogicalFieldRefSchema.extend({
    op: z.enum(['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE', 'IN']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))])
});

const LogicalOrderSchema = LogicalFieldRefSchema.extend({
    dir: z.enum(['asc', 'desc']).default('asc'),
    agg: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional()
});

const LogicalTimeSemanticsSchema = z.object({
    grain: z.enum(['day', 'week', 'month', 'year']),
    dimension: LogicalFieldRefSchema.optional(),
    range: z.string().optional()
});

const LogicalRankingSemanticsSchema = z.object({
    limit: z.number().int().positive().max(100),
    direction: z.enum(['asc', 'desc']).default('desc'),
    target: LogicalFieldRefSchema.optional(),
    agg: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional()
});

const LogicalPlanBaseSchema = z.object({
    intent: z.string().default(''),
    assumptions: z.array(z.string()).default([]),
    relationships: z.array(LogicalRelationshipSchema).optional(),
    filters: z.array(LogicalFilterSchema).optional(),
    dimensions: z.array(LogicalFieldRefSchema).optional(),
    measures: z.array(LogicalMeasureSchema).optional(),
    order: z.array(LogicalOrderSchema).optional(),
    time: LogicalTimeSemanticsSchema.optional(),
    ranking: LogicalRankingSemanticsSchema.optional(),
    derived: z.array(LogicalDerivedOperationSchema).optional(),
    limit: z.number().max(100).default(100),
    riskFlags: z.array(z.string()).optional()
});

export const StructuredLogicalQueryPlanSchema = LogicalPlanBaseSchema.extend({
    requires_raw_sql: z.literal(false).default(false),
    raw_sql_fallback: z.string().optional()
});

export const RawLogicalQueryPlanSchema = LogicalPlanBaseSchema.extend({
    requires_raw_sql: z.literal(true),
    raw_sql_fallback: z.string().min(1)
});

export const LogicalQueryPlanSchema = z.union([
    StructuredLogicalQueryPlanSchema,
    RawLogicalQueryPlanSchema
]);

export type LogicalFieldRef = z.infer<typeof LogicalFieldRefSchema>;
export type LogicalMeasure = z.infer<typeof LogicalMeasureSchema>;
export type LogicalRelationship = z.infer<typeof LogicalRelationshipSchema>;
export type LogicalFilter = z.infer<typeof LogicalFilterSchema>;
export type LogicalOrder = z.infer<typeof LogicalOrderSchema>;
export type LogicalTimeSemantics = z.infer<typeof LogicalTimeSemanticsSchema>;
export type LogicalRankingSemantics = z.infer<typeof LogicalRankingSemanticsSchema>;
export type StructuredLogicalQueryPlan = z.infer<typeof StructuredLogicalQueryPlanSchema>;
export type RawLogicalQueryPlan = z.infer<typeof RawLogicalQueryPlanSchema>;
export type LogicalQueryPlan = z.infer<typeof LogicalQueryPlanSchema>;
