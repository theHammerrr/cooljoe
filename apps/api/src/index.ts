import express, { Request, Response } from 'express';
import copilotRouter from './copilot';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

export const app = express();
const port = process.env.PORT || 3001;
const allowOrigins = process.env.CLIENT_URL?.split(',') || ""

console.log({ allowOrigins });

app.use(cors({ origin: allowOrigins }));
app.use(express.json());

// Main Copilot integration
app.use('/api/copilot', copilotRouter);

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`API Server listening on port ${port}`);
    });
}
