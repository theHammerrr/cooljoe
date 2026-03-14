import { Request, Response } from 'express';
import { z } from 'zod';
import { DisallowedTableError, validateAndFormatQuery } from '../safety/queryValidator';
import { allowlistService } from '../services/allowlistService';
import { retrievalService } from '../services/retrievalService';
import { validateRunQueryTablesAgainstSchema } from '../safety/runQuerySchemaGuard';
import { analyzeQuery as analyzeQueryService } from '../services/queryAnalysis/queryAnalysisService';
import { getErrorMessage } from '../utils/errorUtils';
import { assertAnalyzeQueryModeAllowed } from './analyzeQueryMode';

const analyzeQueryRequestSchema = z.object({
    query: z.string().min(1, 'Query is required.'),
    mode: z.enum(['explain', 'explain_analyze']).optional()
});

export const analyzeQuery = async (req: Request, res: Response) => {
    try {
        const { query, mode = 'explain' } = analyzeQueryRequestSchema.parse(req.body);
        const allowlist = allowlistService.getAllowedTables();
        const safeSql = validateAndFormatQuery(query, allowlist);
        const latestSchema = await retrievalService.getLatestSchema();

        validateRunQueryTablesAgainstSchema(safeSql, latestSchema);
        assertAnalyzeQueryModeAllowed(mode);

        const result = await analyzeQueryService(safeSql, mode);

        return res.json({ success: true, ...result });
    } catch (error: unknown) {
        if (error instanceof DisallowedTableError) {
            return res.status(200).json({
                success: false,
                requiresApproval: true,
                table: error.tableName,
                error: getErrorMessage(error)
            });
        }

        return res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
};
