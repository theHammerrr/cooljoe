import { getProvider } from '../services/llm/providerFactory';
import { DraftTargetMode } from '../controllers/draftQuery/buildDraftContext';
import { getErrorMessage } from '../utils/errorUtils';
import { DraftQueryCommand } from '../domain/draftQuery';
import {
    createDraftJobExecutionControl,
    DraftJobCancelledError,
    DraftJobTimeoutError
} from './draftJobExecutionControl';
import {
    persistRuntimeFailure,
} from './draftQueryApplicationServiceResult';
import { runDraftJobCore } from './draftQueryApplicationServiceCore';

const aiProvider = getProvider();

export interface DraftQueryApplicationResult {
    status: number;
    payload: Record<string, unknown>;
}

class DraftQueryApplicationService {
    async runDraftJob(command: DraftQueryCommand, requestId: string, traceId: string): Promise<DraftQueryApplicationResult> {
        const executionControl = createDraftJobExecutionControl(requestId);

        try {
            const { question, preferred, constraints } = command;
            const preferredMode: DraftTargetMode = preferred === 'prisma' ? 'prisma' : 'sql';

            return runDraftJobCore({ aiProvider, command: { ...command, question, constraints }, requestId, traceId, preferredMode, executionControl });
        } catch (error: unknown) {
            if (error instanceof DraftJobCancelledError) {
                const payload = { error: error.message, cancelled: true };

                return { status: 409, payload };
            }

            if (error instanceof DraftJobTimeoutError) {
                const payload = { error: error.message, timedOut: true };

                return persistRuntimeFailure(requestId, 504, payload);
            }

            const payload = { error: getErrorMessage(error) };

            return persistRuntimeFailure(requestId, 500, payload);
        }
    }
}

export const draftQueryApplicationService = new DraftQueryApplicationService();
