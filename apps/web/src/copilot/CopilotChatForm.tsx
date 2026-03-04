import { useState } from 'react';

interface CopilotChatFormProps {
    onSend: (text: string) => void;
    disabled: boolean;
}

export function CopilotChatForm({ onSend, disabled }: CopilotChatFormProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data (e.g., 'active users')..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                disabled={disabled}
            />
            <button 
                type="submit" 
                disabled={disabled || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
                ➤
            </button>
        </form>
    );
}
