import { StructuredLogicalQueryPlan } from './logicalPlanTypes';

export function enrichDimensionsWithDerivedOperations(
    dimensions: NonNullable<StructuredLogicalQueryPlan['dimensions']>,
    plan: StructuredLogicalQueryPlan
): NonNullable<StructuredLogicalQueryPlan['dimensions']> {
    const nextDimensions = [...dimensions];

    for (const operation of plan.derived || []) {
        if (operation.kind !== 'time_bucket') continue;

        const exists = nextDimensions.some((dimension) =>
            dimension.table === operation.source.table &&
            dimension.column === operation.source.column
        );

        if (exists) continue;

        nextDimensions.unshift({
            table: operation.source.table,
            tableRef: operation.source.tableRef,
            role: operation.source.role,
            column: operation.source.column,
            alias: operation.alias || `${operation.grain}_${operation.source.column}`
        });
    }

    return nextDimensions;
}

export function enrichMeasuresWithDerivedOperations(
    measures: NonNullable<StructuredLogicalQueryPlan['measures']>,
    plan: StructuredLogicalQueryPlan
): NonNullable<StructuredLogicalQueryPlan['measures']> {
    const nextMeasures = [...measures];

    for (const operation of plan.derived || []) {
        if (operation.kind !== 'distinct_count') continue;

        const exists = nextMeasures.some((measure) =>
            measure.table === operation.source.table &&
            measure.column === operation.source.column &&
            measure.agg === 'count'
        );

        if (exists) continue;

        nextMeasures.push({
            table: operation.source.table,
            tableRef: operation.source.tableRef,
            role: operation.source.role,
            column: operation.source.column,
            agg: 'count',
            alias: operation.alias || `distinct_${operation.source.column}`
        });
    }

    return nextMeasures;
}
