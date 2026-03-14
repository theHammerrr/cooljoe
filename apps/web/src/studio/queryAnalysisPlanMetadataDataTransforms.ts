import type { QueryAnalysisPlanMetadataShape } from './queryAnalysisPlanMetadataCommon';

export const PLAN_METADATA_TRANSFORMS: Record<string, QueryAnalysisPlanMetadataShape> = {
    Aggregate: {
        meaning: 'Computes grouped or scalar aggregates such as COUNT, SUM, AVG, MIN, or MAX.',
        sqlReference: 'Usually tied to SELECT aggregates and GROUP BY clauses.'
    },
    GroupAggregate: {
        meaning: 'Computes grouped or scalar aggregates such as COUNT, SUM, AVG, MIN, or MAX.',
        sqlReference: 'Usually tied to SELECT aggregates and GROUP BY clauses.'
    },
    HashAggregate: {
        meaning: 'Computes grouped or scalar aggregates such as COUNT, SUM, AVG, MIN, or MAX.',
        sqlReference: 'Usually tied to SELECT aggregates and GROUP BY clauses.'
    },
    WindowAgg: {
        meaning: 'Computes window functions while preserving row-level output.',
        sqlReference: 'Usually tied to OVER (...) clauses such as ROW_NUMBER(), SUM() OVER, or partitioned ranking.'
    },
    Limit: {
        meaning: 'Stops after the requested number of rows.',
        sqlReference: 'Usually tied directly to the LIMIT clause.'
    },
    Unique: {
        meaning: 'Removes duplicate rows from the incoming stream.',
        sqlReference: 'Usually tied to DISTINCT, DISTINCT ON, or duplicate elimination before a set operation.'
    },
    Append: {
        meaning: 'Concatenates rows from multiple child plans one after another.',
        sqlReference: 'Usually tied to UNION ALL, partitioned tables, or inheritance-style scans.'
    },
    'Merge Append': {
        meaning: 'Merges already-sorted child streams into one ordered result.',
        sqlReference: 'Usually tied to ORDER BY across partitions or multiple sorted sources.'
    },
    Materialize: {
        meaning: 'Buffers rows from a child node so they can be reread efficiently.',
        sqlReference: 'Usually tied indirectly to JOIN reuse, repeated probes, or planner decisions to cache intermediate results.'
    },
    Memoize: {
        meaning: 'Caches repeated lookups from a child node to avoid doing the same work many times.',
        sqlReference: 'Usually tied to repeated join-key probes in nested loops.'
    },
    Gather: {
        meaning: 'Collects rows produced in parallel workers into a single stream.',
        sqlReference: 'Usually tied to planner-selected parallel execution for large scans or joins.'
    },
    'Gather Merge': {
        meaning: 'Collects parallel worker output while preserving sorted order.',
        sqlReference: 'Usually tied to parallel plans that also need ORDER BY-compatible output.'
    },
    'Subquery Scan': {
        meaning: 'Reads rows from a derived table or subquery result as if it were a relation.',
        sqlReference: 'Usually tied to a subquery in FROM, a view expansion, or an aliased derived table.'
    },
    'CTE Scan': {
        meaning: 'Reads rows from a common table expression that was produced elsewhere in the plan.',
        sqlReference: 'Usually tied directly to a WITH clause reference.'
    },
    Result: {
        meaning: 'Produces computed expressions or a trivial row without scanning a base relation.',
        sqlReference: 'Usually tied to constant expressions, projection logic, or planner-inserted wrapper steps.'
    },
    SetOp: {
        meaning: 'Implements duplicate handling for set operations.',
        sqlReference: 'Usually tied to UNION, INTERSECT, or EXCEPT without ALL.'
    }
};
