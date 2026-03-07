import type { ReactNode } from 'react';
import { tokenizeQueryLine } from './tokenizeQueryLine';

export function renderHighlightedQuery(
    content: string,
    language: 'sql' | 'prisma' | 'code'
): ReactNode {
    return content.split('\n').map((line, lineIndex, lines) => (
        <div key={`line-${lineIndex}`}>
            {tokenizeQueryLine(line, language).map((token, tokenIndex) => (
                <span key={`token-${lineIndex}-${tokenIndex}`} className={token.className}>
                    {token.value}
                </span>
            ))}
            {lineIndex < lines.length - 1 ? '\n' : null}
        </div>
    ));
}
