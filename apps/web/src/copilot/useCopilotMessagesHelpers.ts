import { DraftQueryApiError } from '../api/copilot/useDraftQuery';
import type { DraftJobResult } from '../api/copilot/useDraftQuery';
import { parseDraftJobPayload } from '../api/copilot/draftJobPayload';
import { formatDraftFailureMessage } from './draftErrorMessages';
import { createMessageId } from './messageIds';
import type { CopilotMessage } from './types';

export function buildRetryConstraints(issues: string[], previousDraftSql?: string): string {
    const parts = ['Previous draft failed schema validation.', ...issues.map((issue) => `- ${issue}`)];

    if (previousDraftSql) parts.push(`Previous invalid SQL:\n${previousDraftSql}`);

    return parts.join('\n');
}

export function toDraftQueryApiError(payload: unknown): DraftQueryApiError {
    const parsedPayload = parseDraftJobPayload(payload);
    const error = new DraftQueryApiError(
        parsedPayload && parsedPayload.kind !== 'query' && parsedPayload.kind !== 'clarification'
            ? parsedPayload.error
            : 'Failed to draft query'
    );

    if (parsedPayload?.kind === 'validation_error') {
        error.issues = parsedPayload.issues;
        error.draft = parsedPayload.draft;
    } else if (parsedPayload?.kind === 'runtime_error') {
        error.issues = [];
    }

    return error;
}

export function appendRecoveredQuestionMessage(
    prev: CopilotMessage[],
    question: string,
    intent: 'sql' | 'prisma'
): CopilotMessage[] {
    const hasQuestionMessage = prev.some((message) => message.role === 'user' && message.text === question && message.mode === intent);

    if (hasQuestionMessage) return prev;

    return prev.concat({ id: createMessageId('resume-user'), role: 'user', text: question, mode: intent });
}

export function buildDraftFailureMessages(
    prev: CopilotMessage[],
    question: string,
    intent: 'sql' | 'prisma',
    error: unknown
): CopilotMessage[] {
    if (!(error instanceof DraftQueryApiError)) {
        return prev.concat({ id: createMessageId('err'), role: 'assistant', text: "Sorry, I couldn't generate a query." });
    }

    const issues = error.issues || [];
    const draftObj = error.draft;
    const previousDraftSql = typeof draftObj === 'object' && draftObj !== null && typeof Reflect.get(draftObj, 'sql') === 'string'
        ? String(Reflect.get(draftObj, 'sql'))
        : undefined;

    return prev.concat({
        id: createMessageId('err'),
        role: 'assistant',
        text: issues[0]
            ? `Sorry, I couldn't generate a valid query. ${formatDraftFailureMessage(issues[0])}`
            : "Sorry, I couldn't generate a query.",
        mode: intent,
        retryDraft: { question, mode: intent, constraints: buildRetryConstraints(issues, previousDraftSql) }
    });
}

export function buildDraftResultMessages(
    prev: CopilotMessage[],
    job: DraftJobResult,
    intent: 'sql' | 'prisma'
): CopilotMessage[] | null {
    const resultPayload = job.resultPayload;

    if (resultPayload?.kind === 'query') {
        return prev.concat({
            id: createMessageId('draft'),
            role: 'assistant',
            text: "Here's the dataset you requested:",
            queryBlock: resultPayload.query,
            mode: intent
        });
    }

    if (resultPayload?.kind === 'clarification') {
        return prev.concat({
            id: createMessageId('clarify'),
            role: 'assistant',
            text: resultPayload.clarification.message,
            mode: intent
        });
    }

    if (job.status === 'cancelled' || job.stage === 'cancelled') {
        return prev.concat({
            id: createMessageId('cancel'),
            role: 'assistant',
            text: 'Draft cancelled.',
            mode: intent
        });
    }

    return null;
}

export function hasRenderableDraftResult(job: DraftJobResult): boolean {
    if (job.status === 'cancelled' || job.stage === 'cancelled') {
        return true;
    }

    return job.resultPayload?.kind === 'query' || job.resultPayload?.kind === 'clarification';
}
