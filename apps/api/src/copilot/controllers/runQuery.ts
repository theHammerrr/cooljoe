import { Request, Response } from 'express';
import { validateAndFormatQuery, DisallowedTableError } from '../safety/queryValidator';
import { executeTargetQuery } from '../services/executionService';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../utils/errorUtils';
import { allowlistService } from '../services/allowlistService';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const runQuery = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        const allowlist = allowlistService.getAllowedTables();

        console.time('runQuery-AST');
        const safeSql = validateAndFormatQuery(query, allowlist);
        console.timeEnd('runQuery-AST');

        console.time('runQuery-DBTarget');
        const { rows, runtimeMs, rowCount } = await executeTargetQuery(safeSql);
        console.timeEnd('runQuery-DBTarget');

        const queryHash = crypto.createHash('sha256').update(safeSql).digest('hex');

        const queryLog = await prisma.queryLog.create({
            data: {
                queryHash,
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
        if (error instanceof DisallowedTableError) {
            return res.status(200).json({
                success: false,
                requiresApproval: true,
                table: error.tableName,
                error: getErrorMessage(error)
            });
        }
        console.error("RunQuery Error", error);
        res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
};
