export interface ChatParams {
    prompt: string;
    context?: unknown;
}

export interface SuggestedDraftPayload {
    question: string;
    mode: 'sql' | 'prisma';
    reason?: string;
    constraints?: string;
    ctaLabel?: string;
}

export interface ChatResponse {
    success: boolean;
    message: string;
    suggestedDraft?: SuggestedDraftPayload | null;
}

export interface SendChatOptions {
    onChunk: (chunk: string) => void;
    onSuccess: (data: { message: string; suggestedDraft?: SuggestedDraftPayload | null }) => void;
    onError: () => void;
}
