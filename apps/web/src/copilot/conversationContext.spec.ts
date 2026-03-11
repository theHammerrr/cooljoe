/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';
import { buildConversationContext } from './conversationContext';
import { buildConversationMemoryConstraints } from './conversationMemory';
import type { CopilotMessage } from './types';

describe('buildConversationContext', () => {
    it('includes structured memory and topic id', () => {
        const messages: CopilotMessage[] = [
            { id: '1', role: 'user', text: 'show monthly revenue by employee', mode: 'chat' },
            { id: '2', role: 'assistant', text: 'Use this query', mode: 'chat', queryBlock: { intent: 'sql', sql: 'select * from employee', riskFlags: [] } }
        ];

        const context = buildConversationContext(messages, 'now do it for last 30 days', 'topic_123', 'chat');

        expect(context.topicId).toBe('topic_123');
        expect(context.conversationMemory).toMatchObject({
            topicId: 'topic_123',
            confirmedMetrics: expect.arrayContaining(['revenue']),
            confirmedDimensions: expect.arrayContaining(['employee']),
            confirmedTimeGrain: 'month',
            confirmedTimeRange: 'last 30 days'
        });
        expect(context.conversationMemory.assistantQueryHints[0]?.query).toContain('select * from employee');
    });

    it('builds draft-safe memory constraints without raw transcript', () => {
        const constraints = buildConversationMemoryConstraints({
            topicId: 'topic_123',
            activeGoal: 'show monthly revenue by employee',
            preferredMode: 'sql',
            confirmedMetrics: ['revenue'],
            confirmedDimensions: ['employee'],
            confirmedTimeGrain: 'month',
            confirmedTimeRange: 'last 30 days',
            assistantQueryHints: [{ mode: 'sql', query: 'select employee_id, sum(amount) from sales group by employee_id' }]
        });

        expect(constraints).toContain('Conversation topic: topic_123');
        expect(constraints).toContain('Confirmed metrics: revenue');
        expect(constraints).toContain('Latest assistant SQL hint');
    });
});
