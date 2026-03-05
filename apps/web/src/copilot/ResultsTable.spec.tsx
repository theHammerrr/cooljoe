import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsTable } from './ResultsTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('ResultsTable', () => {
    const mockData = [
        { id: 1, name: 'Alice', role: 'Admin' },
        { id: 2, name: 'Bob', role: 'User' }
    ];

    it('renders the table with correct headers and data', () => {
        const handleClear = vi.fn();
        render(
            <QueryClientProvider client={queryClient}>
                <ResultsTable tableResults={mockData} onClear={handleClear} />
            </QueryClientProvider>
        );

        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('role')).toBeInTheDocument();
        
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('calls onClear when closing the table', () => {
        const handleClear = vi.fn();
        render(
            <QueryClientProvider client={queryClient}>
                <ResultsTable tableResults={mockData} onClear={handleClear} />
            </QueryClientProvider>
        );

        const closeBtn = screen.getByText('✕');
        fireEvent.click(closeBtn);
        expect(handleClear).toHaveBeenCalled();
    });

    it('renders nothing when empty data is provided', () => {
        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <ResultsTable tableResults={[]} onClear={vi.fn()} />
            </QueryClientProvider>
        );
        expect(container).toBeEmptyDOMElement();
    });
});
