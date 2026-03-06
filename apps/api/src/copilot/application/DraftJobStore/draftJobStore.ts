import { PrismaClient } from '@prisma/client';
import { draftJobEventBus } from '../draftJobEventBus';
import { DraftJobEvent } from '../../domain/draftQuery';
import { CreateDraftJobInput, DraftJobStatusRecord } from './types';

const prisma = new PrismaClient();

class DraftJobStore {
    private subscribed = false;

    ensureEventSubscription(): void {
        if (this.subscribed) return;
        this.subscribed = true;
        draftJobEventBus.subscribe((event) => {
            void this.recordEvent(event);
        });
    }

    async createJob(input: CreateDraftJobInput): Promise<void> {
        try {
            await prisma.draftJob.upsert({
                where: { requestId: input.requestId },
                create: {
                    requestId: input.requestId,
                    question: input.question,
                    preferredMode: input.preferredMode,
                    constraints: input.constraints ?? null,
                    stage: 'fetching_context',
                    done: false,
                    updatedAt: new Date()
                },
                update: {
                    question: input.question,
                    preferredMode: input.preferredMode,
                    constraints: input.constraints ?? null,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.warn('[draftJobStore] createJob persistence skipped:', error);
        }
    }

    async recordAttempt(
        requestId: string,
        attempt: number,
        sql: string,
        valid: boolean,
        issues: string[]
    ): Promise<void> {
        try {
            await prisma.draftJobAttempt.create({
                data: {
                    requestId,
                    attempt,
                    sql,
                    valid,
                    issues: issues,
                }
            });
        } catch (error) {
            console.warn('[draftJobStore] recordAttempt persistence skipped:', error);
        }
    }

    async getStatus(requestId: string): Promise<DraftJobStatusRecord | null> {
        try {
            const job = await prisma.draftJob.findUnique({
                where: { requestId }
            });

            if (!job) return null;

            return {
                requestId: job.requestId,
                stage: job.stage,
                attempt: job.attempt ?? undefined,
                detail: job.detail ?? undefined,
                done: job.done,
                error: job.error ?? undefined,
                updatedAt: job.updatedAt.getTime()
            };
        } catch (error) {
            console.warn('[draftJobStore] getStatus persistence unavailable:', error);

            return null;
        }
    }

    private async recordEvent(event: DraftJobEvent): Promise<void> {
        try {
            const done = event.type === 'draft.completed' || event.type === 'draft.failed';
            const newStage = done ? (event.type === 'draft.failed' ? 'failed' : 'completed') : event.stage;

            await prisma.$transaction([
                prisma.draftJobEvent.create({
                    data: {
                        requestId: event.requestId,
                        type: event.type,
                        stage: event.stage,
                        attempt: event.attempt ?? null,
                        detail: event.detail ?? null,
                        error: event.error ?? null,
                        occurredAt: new Date(event.occurredAt)
                    }
                }),
                prisma.draftJob.updateMany({
                    where: { requestId: event.requestId },
                    data: {
                        stage: newStage,
                        attempt: event.attempt ?? null,
                        detail: event.detail ?? null,
                        done: done,
                        error: event.error ?? null,
                        updatedAt: new Date()
                    }
                })
            ]);
        } catch (error) {
            console.warn('[draftJobStore] recordEvent persistence skipped:', error);
        }
    }
}

export const draftJobStore = new DraftJobStore();
