import type { QueryAnalysisPlanMetadataShape } from './queryAnalysisPlanMetadataCommon';

export const PLAN_METADATA_SCAN_AND_JOIN: Record<string, QueryAnalysisPlanMetadataShape> = {
    'Seq Scan': {
        meaning: 'Reads the whole table row by row instead of using an index path.',
        sqlReference: 'Usually tied to FROM {relation} with a WHERE filter that was not selective enough or not indexable.'
    },
    'Index Scan': {
        meaning: 'Uses an index to locate matching rows, then fetches table rows as needed.',
        sqlReference: 'Usually tied to WHERE predicates or join conditions on {relation}.'
    },
    'Index Only Scan': {
        meaning: 'Reads from the index alone without fetching heap rows when the index covers the query.',
        sqlReference: 'Usually tied to SELECT, WHERE, or ORDER BY clauses satisfied directly by an index on {relation}.'
    },
    'Bitmap Heap Scan': {
        meaning: 'Uses bitmap matches from one or more indexes, then fetches matching heap pages.',
        sqlReference: 'Usually tied to WHERE predicates on {relation} that match many rows.'
    },
    'Bitmap Index Scan': {
        meaning: 'Builds a bitmap of matching row locations from an index.',
        sqlReference: 'Usually tied to one indexed predicate in the WHERE clause, often before a Bitmap Heap Scan on {relation}.'
    },
    'Nested Loop': {
        meaning: 'For each row from one input, probes the other input. Good for selective joins, expensive when row counts grow.',
        sqlReference: 'Usually tied to JOIN conditions and the order in which filters are applied.'
    },
    'Hash Join': {
        meaning: 'Builds a hash table for one side of the join, then probes it from the other side.',
        sqlReference: 'Usually tied to join predicates such as JOIN ... ON a.id = b.a_id.'
    },
    'Merge Join': {
        meaning: 'Consumes two already-sorted inputs and merges them on the join key.',
        sqlReference: 'Usually tied to JOIN clauses where both sides can be ordered on the join key.'
    },
    Sort: {
        meaning: 'Materializes rows into sorted order.',
        sqlReference: 'Usually tied to ORDER BY, DISTINCT, merge joins, or grouped aggregation input ordering.'
    },
    'Incremental Sort': {
        meaning: 'Sorts only the portion of keys that are not already ordered by the incoming rows.',
        sqlReference: 'Usually tied to ORDER BY when the input is partially ordered by an index or an earlier plan step.'
    }
};
