import { Request, Response } from 'express';
import { allowlistService } from '../services/allowlistService';

export const removeTable = (req: Request, res: Response) => {
    const { table } = req.body;

    if (!allowlistService.isEnabled()) {
        return res.json({ success: true, allowlistEnabled: false, allowedTables: [] });
    }

    if (typeof table !== 'string' || !table.trim()) {
        res.status(400).json({ error: 'Table name is required.' });

        return;
    }

    allowlistService.removeTable(table.trim().toLowerCase());
    res.json({ success: true, allowlistEnabled: true, allowedTables: allowlistService.getAllowedTables() });
};
