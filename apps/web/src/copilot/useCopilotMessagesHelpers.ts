import { DraftQueryApiError } from '../api/copilot/useDraftQuery';
import type { DraftJobResult } from '../api/copilot/useDraftQuery';
import { formatDraftFailureMessage } from './draftErrorMessages';
import { isClarificationPayload, isQueryBlock, type CopilotMessage } from './types';

export function buildRetryConstraints(issues: string[], previousDraftSql?: string): string {
    const parts = ['Previous draft failed schema validation.', ...issues.map((issue) => `- ${issue}`)];

    if (previousDraftSql) parts.push(`Previous invalid SQL:\n${previousDraftSql}`);

    return parts.join('\n');
}

export function buildRecentTurns(messages: CopilotMessage[], nextUserText: string) {
    const base = messages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .slice(-5)
        .map((message) => ({ role: message.role, text: message.text }));

    return base.concat({ role: 'user', text: nextUserText });
}

export function toDraftQueryApiError(payload: unknown): DraftQueryApiError {
    const source = payload && typeof payload === 'object' ? payload : {};
    const error = new DraftQueryApiError(
        typeof Reflect.get(source, 'error') === 'string'
            ? String(Reflect.get(source, 'error'))
            : 'Failed to draft query'
    );
    const issues = Reflect.get(source, 'issues');

    if (Array.isArray(issues)) {
        error.issues = issues.filter((item): item is string => typeof item === 'string');
    }

    error.draft = Reflect.get(source, 'draft');

    return error;
}

export function appendRecoveredQuestionMessage(
    prev: CopilotMessage[],
    question: string,
    intent: 'sql' | 'prisma'
): CopilotMessage[] {
    const hasQuestionMessage = prev.some((message) => message.role === 'user' && message.text === question && message.mode === intent);

    if (hasQuestionMessage) return prev;

    return prev.concat({ id: `resume-user-${Date.now()}`, role: 'user', text: question, mode: intent });
}

export function buildDraftFailureMessages(
    prev: CopilotMessage[],
    question: string,
    intent: 'sql' | 'prisma',
    error: unknown
): CopilotMessage[] {
    if (!(error instanceof DraftQueryApiError)) {
        return prev.concat({ id: `err-${Date.now()}`, role: 'assistant', text: "Sorry, I couldn't generate a query." });
    }

    const issues = error.issues || [];
    const draftObj = error.draft;
    const previousDraftSql = typeof draftObj === 'object' && draftObj !== null && typeof Reflect.get(draftObj, 'sql') === 'string'
        ? String(Reflect.get(draftObj, 'sql'))
        : undefined;

    return prev.concat({
        id: `err-${Date.now()}`,
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
    const queryBlock = job.resultPayload;

    if (job.resultStatus === 200 && isQueryBlock(queryBlock)) {
        return prev.concat({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: "Here's the dataset you requested:",
            queryBlock,
            mode: intent
        });
    }

    if (job.resultStatus === 200 && isClarificationPayload(queryBlock)) {
        return prev.concat({
            id: `clarify-${Date.now()}`,
            role: 'assistant',
            text: queryBlock.message,
            mode: intent
        });
    }

    if (job.status === 'cancelled' || job.stage === 'cancelled') {
        return prev.concat({
            id: `cancel-${Date.now()}`,
            role: 'assistant',
            text: 'Draft cancelled.',
            mode: intent
        });
    }

    return null;
}
