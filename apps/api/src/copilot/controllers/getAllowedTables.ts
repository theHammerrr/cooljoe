import { Request, Response } from 'express';
import { allowlistService } from '../services/allowlistService';

export const getAllowedTables = (_req: Request, res: Response) => {
    res.json({
        allowlistEnabled: allowlistService.isEnabled(),
        allowedTables: allowlistService.getAllowedTables()
    });
};
