import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const DraftTargetModeSchema = z.enum(['sql', 'prisma']);

export const DraftQueryCommandSchema = z.object({
    question: z.string().trim().min(1).max(2000),
    preferred: DraftTargetModeSchema.optional().default('sql'),
    constraints: z.string().trim().max(8000).optional(),
    requestId: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    statusToken: z.string().trim().min(1).max(4096).optional()
});

export type DraftQueryCommand = z.infer<typeof DraftQueryCommandSchema>;
export const CreateDraftJobCommandSchema = DraftQueryCommandSchema.omit({ requestId: true, statusToken: true });
export type CreateDraftJobCommand = z.infer<typeof CreateDraftJobCommandSchema>;

export type DraftJobStage =
    | 'pending'
    | 'fetching_context'
    | 'building_context'
    | 'planning_with_llm'
    | 'compiling_and_validating'
    | 'retrying_with_stricter_context'
    | 'finalizing_draft'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface DraftJobEvent {
    type: 'draft.started' | 'draft.progressed' | 'draft.completed' | 'draft.failed' | 'draft.cancelled';
    requestId: string;
    stage: DraftJobStage;
    attempt?: number;
    detail?: string;
    error?: string;
    occurredAt: number;
}

export function createDraftJobId(): string {
    return `draft_${randomUUID().replace(/-/g, '')}`;
}
