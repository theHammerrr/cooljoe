import type { CopilotMessage } from './types';

interface ChatMessageAnswerActionsProps {
    message: CopilotMessage;
    onInjectSql?: (sql: string, prisma?: string) => void;
    onSuggestedDraft?: (draft: NonNullable<CopilotMessage['suggestedDraft']>) => void;
}

export function ChatMessageAnswerActions({
    message,
    onInjectSql,
    onSuggestedDraft
}: ChatMessageAnswerActionsProps) {
    if (!message.suggestedDraft && !message.suggestedInjection) {
        return null;
    }

    const helperText =
        message.suggestedInjection?.reason ||
        message.suggestedDraft?.reason ||
        'Use this answer directly or regenerate a validated draft.';

    return (
        <div className="mt-2 w-full rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-violet-300">
            <p className="leading-5 text-violet-200/95 break-words">
                {helperText}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                {message.suggestedInjection && onInjectSql && (
                    <button
                        onClick={() => onInjectSql(message.suggestedInjection?.sql || '', message.suggestedInjection?.prisma)}
                        title={message.suggestedInjection.tooltip}
                        className="min-w-0 rounded-lg border border-emerald-500/20 bg-emerald-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/30"
                    >
                        {message.suggestedInjection.ctaLabel || 'Inject Query'}
                    </button>
                )}
                {message.suggestedDraft && onSuggestedDraft && (
                    <button
                        onClick={() => {
                            if (message.suggestedDraft) {
                                onSuggestedDraft(message.suggestedDraft);
                            }
                        }}
                        title={message.suggestedDraft.tooltip}
                        className="min-w-0 rounded-lg border border-violet-400/20 bg-violet-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-200 transition-colors hover:bg-violet-500/30"
                    >
                        {message.suggestedDraft.ctaLabel || `Generate ${message.suggestedDraft.mode.toUpperCase()}`}
                    </button>
                )}
            </div>
        </div>
    );
}
