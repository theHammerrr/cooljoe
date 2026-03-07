import { Router } from 'express';
import { refreshSchema, getLatestSchema } from './controllers/schemaController';
import { cancelDraftJob, createDraftJob, draftQuery, draftQueryStatus, draftQueryStatusStream, getDraftJob, issueDraftQueryToken } from './controllers/draftQuery';
import { runQuery } from './controllers/runQuery';
import { explainResults } from './controllers/explainResults';
import { acceptQuery } from './controllers/acceptQuery';
import { exportExcel } from './controllers/exportExcel';
import { getAnalytics } from './controllers/getAnalytics';
import { getDraftOps } from './controllers/getDraftOps';
import { chat } from './controllers/chat';
import { allowTable } from './controllers/allowTable';
import { getAllowedTables } from './controllers/getAllowedTables';
import { removeTable } from './controllers/removeTable';

const router = Router();

// Schema Introspection
router.get('/schema', getLatestSchema);
router.post('/refresh-schema', refreshSchema);
router.get('/allow-tables', getAllowedTables);
router.post('/allow-tables', allowTable);
router.delete('/allow-tables', removeTable);

// Copilot AI Paths
router.post('/draft-jobs', createDraftJob);
router.get('/draft-jobs/:requestId', getDraftJob);
router.post('/draft-jobs/:requestId/cancel', cancelDraftJob);
router.post('/draft-query', draftQuery);
router.post('/draft-query-token', issueDraftQueryToken);
router.get('/draft-query-status/:requestId/stream', draftQueryStatusStream);
router.get('/draft-query-status/:requestId', draftQueryStatus);
router.post('/run-query', runQuery);
router.post('/explain-results', explainResults);
router.post('/accept-query', acceptQuery);
router.post('/export-excel', exportExcel);
router.post('/chat', chat);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/ops/draft-jobs', getDraftOps);

export default router;
