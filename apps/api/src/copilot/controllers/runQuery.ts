import { Request, Response } from 'express';
import { validateAndFormatQuery, DisallowedTableError } from '../safety/queryValidator';
import { executeTargetQuery } from '../services/executionService';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../utils/errorUtils';
import { allowlistService } from '../services/allowlistService';
import { retrievalService } from '../services/retrievalService';
import { validateRunQueryTablesAgainstSchema } from '../safety/runQuerySchemaGuard';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const runQuery = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;

        console.time('runQuery-AST');
        const safeSql = validateAndFormatQuery(query, allowlistService.getAllowedTables(), 100, {
            enforceAllowlist: allowlistService.isEnabled()
        });
        console.timeEnd('runQuery-AST');

        const latestSchema = await retrievalService.getLatestSchema();
        validateRunQueryTablesAgainstSchema(safeSql, latestSchema);

        console.time('runQuery-DBTarget');
        const { rows, runtimeMs, rowCount } = await executeTargetQuery(safeSql);
        console.timeEnd('runQuery-DBTarget');

        const queryHash = crypto.createHash('sha256').update(safeSql).digest('hex');
        const queryLog = await prisma.queryLog.create({
            data: { queryHash, sqlQuery: safeSql, runtimeMs, rowCount }
        });

        return res.json({
            success: true,
            queryLogId: queryLog.id,
            safeSql,
            rows: rows.slice(0, 100),
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

        console.error('RunQuery Error', error);

        return res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
};
