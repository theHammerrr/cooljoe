import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { executeTargetQuery } from '../services/executionService';
import { buildSchemaKnowledgeEntries } from '../services/knowledge/knowledgeMetadata';
import { retrievalService } from '../services/retrievalService';
import { getErrorMessage } from '../utils/errorUtils';
import { buildTopology, schemaQuery, schemaRowsSchema } from './schemaIntrospection';

const prisma = new PrismaClient();
const snapshotResponseSchema = z.object({ success: z.boolean(), snapshotId: z.string(), tablesMatched: z.number() });

export const refreshSchema = async (_req: Request, res: Response) => {
    try {
        const { rows: tablesRaw } = await executeTargetQuery(schemaQuery);
        const schemaRows = schemaRowsSchema.parse(tablesRaw);
        const rawTopology = buildTopology(schemaRows);
        const topology = JSON.parse(JSON.stringify(rawTopology));
        const snapshot = await prisma.schemaSnapshot.upsert({ where: { name: 'public' }, update: { topology, version: { increment: 1 } }, create: { name: 'public', topology } });

        await retrievalService.upsertKnowledgeEntries(buildSchemaKnowledgeEntries(schemaRows));

        res.json(snapshotResponseSchema.parse({ success: true, snapshotId: snapshot.id, tablesMatched: Object.keys(rawTopology).length }));
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getLatestSchema = async (_req: Request, res: Response) => {
    try {
        const snapshot = await prisma.schemaSnapshot.findUnique({ where: { name: 'public' } });

        if (!snapshot) return res.json({ schema: null });

        return res.json({ schema: snapshot });
    } catch (error: unknown) {
        return res.status(500).json({ error: getErrorMessage(error) });
    }
};
