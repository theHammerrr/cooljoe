import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CopilotChatForm } from './CopilotChatForm';

describe('CopilotChatForm', () => {
    it('should call onSend with the correct text and intent', () => {
        const handleSend = vi.fn();
        render(<CopilotChatForm onSend={handleSend} disabled={false} />);

        const input = screen.getByPlaceholderText(/Ask about your data/i);
        const button = screen.getByRole('button');

        fireEvent.change(input, { target: { value: 'How many users?' } });
        fireEvent.click(button);

        expect(handleSend).toHaveBeenCalledWith('How many users?', 'sql');
    });

    it('should switch mode and send as chat intent', () => {
        const handleSend = vi.fn();
        render(<CopilotChatForm onSend={handleSend} disabled={false} />);

        const select = screen.getByRole('combobox');
        const input = screen.getByPlaceholderText(/Ask about your data/i);
        const button = screen.getByRole('button');

        fireEvent.change(select, { target: { value: 'chat' } });
        fireEvent.change(input, { target: { value: 'Hello AI' } });
        fireEvent.click(button);

        expect(handleSend).toHaveBeenCalledWith('Hello AI', 'chat');
    });

    it('should not submit if input is empty or disabled', () => {
        const handleSend = vi.fn();
        const { rerender } = render(<CopilotChatForm onSend={handleSend} disabled={false} />);

        const button = screen.getByRole('button');
        
        // Empty input
        fireEvent.click(button);
        expect(handleSend).not.toHaveBeenCalled();

        // Disabled
        rerender(<CopilotChatForm onSend={handleSend} disabled={true} />);
        fireEvent.click(button);
        expect(handleSend).not.toHaveBeenCalled();
    });
});
