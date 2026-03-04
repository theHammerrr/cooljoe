import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../utils/errorUtils';

const prisma = new PrismaClient();

export const getAnalytics = async (_req: Request, res: Response) => {
    try {
        const totalQueries = await prisma.queryLog.count();

        const aggregate = await prisma.queryLog.aggregate({
            _avg: { runtimeMs: true, rowCount: true },
            _max: { runtimeMs: true, rowCount: true }
        });

        // Group by day for simple timeframe representation
        const recentQueries = await prisma.queryLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { createdAt: true, runtimeMs: true, sqlQuery: true }
        });

        res.json({
            success: true,
            totalQueries,
            avgRuntimeMs: Math.round(aggregate._avg.runtimeMs || 0),
            maxRuntimeMs: aggregate._max.runtimeMs || 0,
            avgRowCount: Math.round(aggregate._avg.rowCount || 0),
            recentQueries
        });
    } catch (error: unknown) {
        console.error("Analytics Error:", error);
        res.status(500).json({ status: 'error', message: getErrorMessage(error) });
    }
};
