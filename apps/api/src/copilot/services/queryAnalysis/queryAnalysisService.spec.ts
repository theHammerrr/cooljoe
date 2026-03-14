import { describe, expect, it, vi } from 'vitest';
import { analyzeQuery } from './queryAnalysisService';
import * as executionService from '../executionService';
import type { QueryResult, QueryResultRow } from 'pg';

function createQueryResult(rows: QueryResultRow[], command: string): QueryResult<QueryResultRow> {
    return {
        rows,
        rowCount: rows.length,
        command,
        oid: 0,
        fields: []
    };
}

function createTableStatsRow(tableName: string, estimatedRows: number): QueryResultRow {
    return {
        schema_name: 'public',
        table_name: tableName,
        estimated_rows: estimatedRows
    };
}

describe('analyzeQuery', () => {
    it('returns plan findings and index metadata for a SQL query', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                    'QUERY PLAN': [{
                        Plan: {
                            'Node Type': 'Seq Scan',
                            'Relation Name': 'orders',
                            Schema: 'public',
                            'Plan Rows': 5000,
                            Filter: '(customer_id = 42)'
                        }
                    }]
                }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([{
                schema_name: 'public',
                table_name: 'orders',
                index_name: 'orders_pkey',
                access_method: 'btree',
                is_primary: true,
                is_unique: true,
                columns: ['id'],
                normalizedColumns: ['id'],
                definition: 'CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id)'
                }], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 120000)], 'SELECT'));

        const result = await analyzeQuery('SELECT * FROM public.orders WHERE customer_id = 42');

        expect(result.mode).toBe('explain');
        expect(result.safetyNotes).toEqual([]);
        expect(result.referencedTables).toEqual(['orders']);
        expect(result.indexes).toHaveLength(1);
        expect(result.findings.map((finding) => finding.title)).toEqual(expect.arrayContaining([
            'Wide projection via SELECT *',
            'Sequential scan on public.orders',
            'No supporting index found for filter on public.orders.customer_id'
        ]));
    });

    it('flags function predicates, leading wildcard LIKE, and missing join indexes', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Nested Loop',
                        'Plan Rows': 1400,
                        Plans: [
                            {
                                'Node Type': 'Seq Scan',
                                'Relation Name': 'orders',
                                Schema: 'public',
                                'Plan Rows': 1400,
                                Filter: "(lower(email) = 'x'::text)"
                            }
                        ]
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([{
                schema_name: 'public',
                table_name: 'orders',
                index_name: 'orders_status_idx',
                access_method: 'btree',
                is_primary: false,
                is_unique: false,
                columns: ['status'],
                normalizedColumns: ['status'],
                definition: 'CREATE INDEX orders_status_idx ON public.orders USING btree (status)'
            }], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([
                createTableStatsRow('orders', 85000),
                createTableStatsRow('customers', 64000)
            ], 'SELECT'));

        const result = await analyzeQuery(
            "SELECT * FROM public.orders o JOIN public.customers c ON o.customer_id = c.id WHERE LOWER(o.email) = 'x' AND c.segment LIKE '%vip'"
        );

        expect(result.findings.map((finding) => finding.title)).toEqual(expect.arrayContaining([
            'Function-wrapped predicate on public.orders.email',
            'Leading wildcard LIKE on public.customers.segment',
            'Join key public.orders.customer_id lacks obvious index support',
            'Join key public.customers.id lacks obvious index support'
        ]));
    });

    it('distinguishes a referenced composite index from a leading-column match', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Seq Scan',
                        'Relation Name': 'orders',
                        Schema: 'public',
                        'Plan Rows': 2500,
                        Filter: "(customer_id = 42)"
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([{
                schema_name: 'public',
                table_name: 'orders',
                index_name: 'orders_status_customer_idx',
                access_method: 'btree',
                is_primary: false,
                is_unique: false,
                columns: ['status', 'customer_id'],
                normalizedColumns: ['status', 'customer_id'],
                definition: 'CREATE INDEX orders_status_customer_idx ON public.orders USING btree (status, customer_id)'
            }], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 92000)], 'SELECT'));

        const result = await analyzeQuery('SELECT * FROM public.orders WHERE customer_id = 42');

        expect(result.findings.map((finding) => finding.title)).toContain(
            'Existing index order may not support filter on public.orders.customer_id'
        );
        expect(result.findings.map((finding) => finding.title)).not.toContain(
            'No supporting index found for filter on public.orders.customer_id'
        );
    });

    it('does not emit missing-index filter advice when the filter column is already leading an index', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Index Scan',
                        'Relation Name': 'orders',
                        Schema: 'public',
                        'Plan Rows': 12,
                        'Index Name': 'orders_customer_id_idx',
                        'Index Cond': '(customer_id = 42)'
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([{
                schema_name: 'public',
                table_name: 'orders',
                index_name: 'orders_customer_id_idx',
                access_method: 'btree',
                is_primary: false,
                is_unique: false,
                columns: ['customer_id'],
                normalizedColumns: ['customer_id'],
                definition: 'CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id)'
            }], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 120000)], 'SELECT'));

        const result = await analyzeQuery('SELECT * FROM public.orders WHERE customer_id = 42');
        const titles = result.findings.map((finding) => finding.title);

        expect(titles).not.toContain('No supporting index found for filter on public.orders.customer_id');
        expect(titles).not.toContain('Existing index order may not support filter on public.orders.customer_id');
    });

    it('flags sorts with no index support and distinguishes composite index order misalignment', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Sort',
                        'Plan Rows': 1800,
                        'Sort Key': ['created_at DESC'],
                        Plans: [{
                            'Node Type': 'Seq Scan',
                            'Relation Name': 'orders',
                            Schema: 'public',
                            'Plan Rows': 1800
                        }]
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([{
                schema_name: 'public',
                table_name: 'orders',
                index_name: 'orders_status_created_idx',
                access_method: 'btree',
                is_primary: false,
                is_unique: false,
                columns: ['status', 'created_at'],
                normalizedColumns: ['status', 'created_at'],
                definition: 'CREATE INDEX orders_status_created_idx ON public.orders USING btree (status, created_at)'
            }], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 120000)], 'SELECT'));

        const misaligned = await analyzeQuery("SELECT * FROM public.orders WHERE customer_id = 42 ORDER BY created_at DESC");
        const misalignedTitles = misaligned.findings.map((finding) => finding.title);

        expect(misalignedTitles).toContain(
            'Existing index may not align with filter/order sequence for public.orders.created_at'
        );

        executeTargetQueryRawSpy.mockReset();
        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Sort',
                        'Plan Rows': 1800,
                        'Sort Key': ['priority DESC'],
                        Plans: [{
                            'Node Type': 'Seq Scan',
                            'Relation Name': 'orders',
                            Schema: 'public',
                            'Plan Rows': 1800
                        }]
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([{
                schema_name: 'public',
                table_name: 'orders',
                index_name: 'orders_status_created_idx',
                access_method: 'btree',
                is_primary: false,
                is_unique: false,
                columns: ['status', 'created_at'],
                normalizedColumns: ['status', 'created_at'],
                definition: 'CREATE INDEX orders_status_created_idx ON public.orders USING btree (status, created_at)'
            }], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 120000)], 'SELECT'));

        const unsupported = await analyzeQuery("SELECT * FROM public.orders WHERE customer_id = 42 ORDER BY priority DESC");
        const unsupportedTitles = unsupported.findings.map((finding) => finding.title);

        expect(unsupportedTitles).toContain(
            'Sort on public.orders.priority has no obvious index support'
        );
    });

    it('suppresses metadata-only index warnings on small tables', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Seq Scan',
                        'Relation Name': 'orders',
                        Schema: 'public',
                        'Plan Rows': 120,
                        Filter: '(customer_id = 42)'
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 200)], 'SELECT'));

        const result = await analyzeQuery('SELECT * FROM public.orders WHERE customer_id = 42');
        const titles = result.findings.map((finding) => finding.title);

        expect(titles).not.toContain('No supporting index found for filter on public.orders.customer_id');
        expect(titles).not.toContain('Sequential scan on public.orders');
    });

    it('supports explain_analyze mode and emits runtime estimate drift findings', async () => {
        const executeTargetQueryRawSpy = vi.spyOn(executionService, 'executeTargetQueryRaw');

        executeTargetQueryRawSpy
            .mockResolvedValueOnce(createQueryResult([{
                'QUERY PLAN': [{
                    Plan: {
                        'Node Type': 'Seq Scan',
                        'Relation Name': 'orders',
                        Schema: 'public',
                        'Plan Rows': 100,
                        'Actual Rows': 5000,
                        'Actual Loops': 1,
                        'Actual Total Time': 88.123,
                        'Shared Hit Blocks': 200,
                        Filter: '(customer_id = 42)'
                    }
                }]
            }], 'EXPLAIN'))
            .mockResolvedValueOnce(createQueryResult([], 'SELECT'))
            .mockResolvedValueOnce(createQueryResult([createTableStatsRow('orders', 120000)], 'SELECT'));

        const result = await analyzeQuery('SELECT * FROM public.orders WHERE customer_id = 42', 'explain_analyze');
        const driftFinding = result.findings.find((finding) => finding.title === 'Seq Scan row estimate drift detected');

        expect(result.mode).toBe('explain_analyze');
        expect(result.safetyNotes).toEqual(['EXPLAIN ANALYZE executes the query and reports actual runtime metrics.']);
        expect(driftFinding?.evidence).toEqual(expect.arrayContaining([
            'Estimated rows: 100.',
            'Actual rows across loops: 5000.',
            'Actual loops: 1.'
        ]));
        expect(
            executeTargetQueryRawSpy.mock.calls.some(([sql]) => String(sql).includes('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)'))
        ).toBe(true);
    });
});
