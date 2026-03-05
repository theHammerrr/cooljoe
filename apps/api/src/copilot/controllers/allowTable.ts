import { Request, Response } from 'express';
import { allowlistService } from '../services/allowlistService';
import { getErrorMessage } from '../utils/errorUtils';
import { retrievalService } from '../services/retrievalService';
import { tableExistsInSchema } from '../safety/draftSchemaValidator';

export const allowTable = async (req: Request, res: Response) => {
    try {
        const { table } = req.body;

        if (typeof table !== 'string' || !table.trim()) {
            return res.status(400).json({ error: "Table name is required." });
        }

        const normalizedTable = table.trim().toLowerCase();
        const latestSchema = await retrievalService.getLatestSchema();
        if (!tableExistsInSchema(latestSchema, normalizedTable)) {
            return res.status(400).json({
                error: `Table '${normalizedTable}' does not exist in the current schema snapshot. Click Sync DB and retry.`
            });
        }

        allowlistService.allowTable(normalizedTable);

        res.json({
            success: true,
            message: `Table '${normalizedTable}' has been added to the active allowlist session.`,
            activeAllowlist: allowlistService.getAllowedTables()
        });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
