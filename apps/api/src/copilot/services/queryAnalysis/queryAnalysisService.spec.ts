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
                    definition: 'CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id)'
                }], 'SELECT'));

        const result = await analyzeQuery('SELECT * FROM public.orders WHERE customer_id = 42');

        expect(result.mode).toBe('explain');
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
                definition: 'CREATE INDEX orders_status_idx ON public.orders USING btree (status)'
            }], 'SELECT'));

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
});
