import { Request, Response } from 'express';
import * as xlsx from 'xlsx';
import { getErrorMessage } from '../utils/errorUtils';

export const exportExcel = async (req: Request, res: Response) => {
    try {
        const { results } = req.body;
        if (!results || !Array.isArray(results) || results.length === 0) {
            return res.status(400).json({ error: "No results provided for export." });
        }

        const worksheet = xlsx.utils.json_to_sheet(results);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Query Results");

        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename="Query_Results.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error: unknown) {
        console.error("Export Error:", error);
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
