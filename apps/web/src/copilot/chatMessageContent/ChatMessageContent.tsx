import { useState } from 'react';
import { parseChatMessageContent } from './parseChatMessageContent';
import { renderHighlightedQuery } from './renderHighlightedQuery';

interface ChatMessageContentProps {
    text: string;
}

export function ChatMessageContent({ text }: ChatMessageContentProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const segments = parseChatMessageContent(text);

    const handleCopy = async (value: string, index: number) => {
        await navigator.clipboard.writeText(value);
        setCopiedIndex(index);
        window.setTimeout(() => {
            setCopiedIndex((current) => current === index ? null : current);
        }, 1200);
    };

    return (
        <div className="space-y-2">
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return (
                        <p key={`text-${index}`} className="whitespace-pre-wrap break-words">
                            {segment.content}
                        </p>
                    );
                }

                return (
                    <div
                        key={`query-${index}`}
                        className="overflow-hidden rounded-lg border border-emerald-500/20 bg-slate-950/80 shadow-inner"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-emerald-500/10 px-3 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/85">
                                {labelForLanguage(segment.language)}
                            </span>
                            <button
                                type="button"
                                onClick={() => void handleCopy(segment.content, index)}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:bg-white/10"
                            >
                                {copiedIndex === index ? 'Copied' : 'Copy Query'}
                            </button>
                        </div>
                        <pre className={`overflow-x-auto px-3 py-3 text-xs whitespace-pre-wrap ${textClassForLanguage(segment.language)}`}>
                            <code>{renderHighlightedQuery(segment.content, segment.language)}</code>
                        </pre>
                    </div>
                );
            })}
        </div>
    );
}

function labelForLanguage(language: 'sql' | 'prisma' | 'code') {
    if (language === 'sql') {
        return 'SQL Query';
    }

    if (language === 'prisma') {
        return 'Prisma Query';
    }

    return 'Query Snippet';
}

function textClassForLanguage(language: 'sql' | 'prisma' | 'code') {
    if (language === 'sql') {
        return 'font-mono text-emerald-300';
    }

    if (language === 'prisma') {
        return 'font-mono text-sky-300';
    }

    return 'font-mono text-slate-200';
}
