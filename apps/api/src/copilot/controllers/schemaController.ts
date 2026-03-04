import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeTargetQuery } from '../services/executionService';
import { z } from 'zod';
import { getErrorMessage } from '../utils/errorUtils';

const prisma = new PrismaClient();

interface TopologyColumn {
    column: string;
    type: string;
}

const schemaRowSchema = z.object({
    table_name: z.string(),
    column_name: z.string(),
    data_type: z.string()
});

const schemaRowsSchema = z.array(schemaRowSchema);
const topologySchema = z.record(z.string(), z.array(z.object({ column: z.string(), type: z.string() })));

export const refreshSchema = async (req: Request, res: Response) => {
    try {
        // Query information_schema for a basic snapshot of the target database
        const schemaQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
        `;
        const { rows: tablesRaw } = await executeTargetQuery(schemaQuery);
        const schemaRows = schemaRowsSchema.parse(tablesRaw);

        // Transform into a structured topology
        const topology = schemaRows.reduce((acc: Record<string, TopologyColumn[]>, row) => {
            if (!acc[row.table_name]) {
                acc[row.table_name] = [];
            }
            acc[row.table_name].push({
                column: row.column_name,
                type: row.data_type
            });
            return acc;
        }, {});
        const topologyJson = topologySchema.parse(topology);

        // Save Snapshot
        const snapshot = await prisma.schemaSnapshot.create({
            data: {
                name: 'public',
                topology: topologyJson
            }
        });

        res.json({ success: true, snapshotId: snapshot.id, tablesMatched: Object.keys(topology).length });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
}
