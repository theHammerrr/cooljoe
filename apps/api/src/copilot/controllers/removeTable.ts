import { Request, Response } from 'express';
import { allowlistService } from '../services/allowlistService';

export const removeTable = (req: Request, res: Response) => {
    const { table } = req.body;
    if (typeof table !== 'string' || !table.trim()) {
        res.status(400).json({ error: "Table name is required." });
        return;
    }

    allowlistService.removeTable(table.trim().toLowerCase());
    res.json({ success: true, allowedTables: allowlistService.getAllowedTables() });
};
