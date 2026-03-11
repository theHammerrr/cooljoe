import { z } from 'zod';

const DerivedFieldRefSchema = z.object({
    table: z.string(),
    column: z.string(),
    tableRef: z.string().optional(),
    role: z.string().optional()
});

export const LogicalDerivedOperationSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('time_bucket'),
        source: DerivedFieldRefSchema,
        grain: z.enum(['day', 'week', 'month', 'year']),
        alias: z.string().optional()
    }),
    z.object({
        kind: z.literal('distinct_count'),
        source: DerivedFieldRefSchema,
        alias: z.string().optional()
    }),
    z.object({
        kind: z.literal('ratio'),
        numerator: DerivedFieldRefSchema,
        denominator: DerivedFieldRefSchema,
        alias: z.string().optional()
    }),
    z.object({
        kind: z.literal('change_vs_previous_period'),
        source: DerivedFieldRefSchema,
        alias: z.string().optional()
    })
]);

export type LogicalDerivedOperation = z.infer<typeof LogicalDerivedOperationSchema>;
