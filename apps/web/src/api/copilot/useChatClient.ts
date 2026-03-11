import { API_BASE_URL } from './apiClient';
import type { ChatParams, ChatResponse, SendChatOptions } from './useChat.types';
import { parseChatStreamEvent } from './useChatStreamEvents';

export async function streamChat(params: ChatParams, options: SendChatOptions) {
    const response = await fetch(`${API_BASE_URL}/api/copilot/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(readErrorMessage(err, 'Failed to stream chat with AI'));
    }

    if (!response.body) {
        throw new Error('Readable stream not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = flushBuffer(buffer, options);
    }

    flushTrailingBuffer(buffer, options);
}

export async function fetchChat(params: ChatParams): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(readErrorMessage(err, 'Failed to chat with AI'));
    }

    return response.json();
}

function flushBuffer(buffer: string, options: SendChatOptions) {
    const lines = buffer.split('\n');
    const pending = lines.pop() || '';

    for (const line of lines) {
        handleStreamLine(line, options);
    }

    return pending;
}

function flushTrailingBuffer(buffer: string, options: SendChatOptions) {
    const trimmed = buffer.trim();

    if (trimmed) {
        handleStreamLine(trimmed, options);
    }
}

function handleStreamLine(line: string, options: SendChatOptions) {
    const trimmed = line.trim();

    if (!trimmed) {
        return;
    }

    const event = parseChatStreamEvent(JSON.parse(trimmed));

    if (!event) {
        throw new Error('Invalid chat stream event');
    }

    if (event.type === 'start') {
        return;
    }

    if (event.type === 'delta') {
        options.onChunk(event.text);

        return;
    }

    if (event.type === 'done') {
        options.onSuccess({ message: event.message, suggestedDraft: event.suggestedDraft });

        return;
    }

    throw new Error(event.error || 'Chat streaming failed');
}

function readErrorMessage(value: unknown, fallback: string) {
    if (typeof value !== 'object' || value === null) {
        return fallback;
    }

    const error = Reflect.get(value, 'error');

    return typeof error === 'string' ? error : fallback;
}
