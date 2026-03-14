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
            'Sequential scan on public.orders'
        ]));
    });
});
