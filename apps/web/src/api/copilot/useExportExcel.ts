import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

export const useExportExcel = () => {
    return useMutation({
        mutationFn: async (results: unknown[]) => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/export-excel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to export Excel");
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Query_Results.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        }
    });
};
