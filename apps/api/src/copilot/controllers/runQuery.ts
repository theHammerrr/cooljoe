import { Request, Response } from 'express';
import { validateAndFormatQuery } from '../safety/queryValidator';
import { executeTargetQuery } from '../services/executionService';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../utils/errorUtils';

const prisma = new PrismaClient();
const MOCK_ALLOWLIST = ['users', 'orders', 'products', 'glossary', 'e2e_test_users']; // In prod this comes from config

export const runQuery = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;

        const safeSql = validateAndFormatQuery(query, MOCK_ALLOWLIST);
        const { rows, runtimeMs, rowCount } = await executeTargetQuery(safeSql);

        const queryLog = await prisma.queryLog.create({
            data: {
                queryHash: 'hash-mock', // TODO implement hash function
                sqlQuery: safeSql,
                runtimeMs,
                rowCount
            }
        });

        res.json({
            success: true,
            queryLogId: queryLog.id,
            safeSql,
            rows: rows.slice(0, 100), // Enforce upper GUI bound limit
            summaryStats: { runtimeMs, rowCount: rows.length }
        });
    } catch (error: unknown) {
        console.error("RunQuery Error", error);
        res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
};
