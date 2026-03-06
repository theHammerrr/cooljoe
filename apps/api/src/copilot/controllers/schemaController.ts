import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeTargetQuery } from '../services/executionService';
import { z } from 'zod';
import { getErrorMessage } from '../utils/errorUtils';

const prisma = new PrismaClient();

interface TopologyColumn {
    column: string;
    type: string;
    isPrimary?: boolean;
    foreignKeyTarget?: string | null;
}

const schemaRowSchema = z.object({
    table_schema: z.string(),
    table_name: z.string(),
    column_name: z.string(),
    data_type: z.string(),
    is_primary: z.string().nullable().optional(),
    foreign_key_target: z.string().nullable().optional()
});

const schemaRowsSchema = z.array(schemaRowSchema);
const topologySchema = z.record(z.string(), z.array(z.object({
    column: z.string(),
    type: z.string(),
    isPrimary: z.boolean().optional(),
    foreignKeyTarget: z.string().nullable().optional()
})));

export const refreshSchema = async (req: Request, res: Response) => {
    try {
        // Query information_schema for a deep snapshot of the target database including constraints
        const schemaQuery = `
            SELECT 
                c.table_schema,
                c.table_name, 
                c.column_name, 
                c.data_type,
                (SELECT tc.constraint_type 
                 FROM information_schema.table_constraints tc
                 JOIN information_schema.key_column_usage kcu 
                   ON tc.constraint_name = kcu.constraint_name
                   AND kcu.table_schema = c.table_schema AND kcu.table_name = c.table_name AND kcu.column_name = c.column_name LIMIT 1) as is_primary,
                (SELECT ccu.table_schema || '.' || ccu.table_name 
                 FROM information_schema.table_constraints tc
                 JOIN information_schema.key_column_usage kcu 
                   ON tc.constraint_name = kcu.constraint_name
                 JOIN information_schema.constraint_column_usage ccu
                   ON ccu.constraint_name = tc.constraint_name
                 WHERE tc.constraint_type = 'FOREIGN KEY' 
                   AND kcu.table_schema = c.table_schema AND kcu.table_name = c.table_name AND kcu.column_name = c.column_name LIMIT 1) as foreign_key_target
            FROM information_schema.columns c
            WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog');
        `;
        const { rows: tablesRaw } = await executeTargetQuery(schemaQuery);
        const schemaRows = schemaRowsSchema.parse(tablesRaw);

        // Transform into a structured topology
        const topology = schemaRows.reduce((acc: Record<string, TopologyColumn[]>, row) => {
            const tableKey = `${row.table_schema}.${row.table_name}`;

            if (!acc[tableKey]) {
                acc[tableKey] = [];
            }
            acc[tableKey].push({
                column: row.column_name,
                type: row.data_type,
                isPrimary: row.is_primary === 'PRIMARY KEY',
                foreignKeyTarget: row.foreign_key_target || null
            });

            return acc;
        }, {});
        const topologyJson = topologySchema.parse(topology);

        // Save snapshot (upsert avoids unique-name collisions when syncing repeatedly)
        const snapshot = await prisma.schemaSnapshot.upsert({
            where: { name: 'public' },
            update: {
                topology: topologyJson,
                version: { increment: 1 }
            },
            create: {
                name: 'public',
                topology: topologyJson
            }
        });

        res.json({ success: true, snapshotId: snapshot.id, tablesMatched: Object.keys(topology).length });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
}

export const getLatestSchema = async (req: Request, res: Response) => {
    try {
        const snapshot = await prisma.schemaSnapshot.findUnique({
            where: { name: 'public' }
        });

        if (!snapshot) {
            return res.json({ schema: null });
        }
        res.json({ schema: snapshot });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
}
