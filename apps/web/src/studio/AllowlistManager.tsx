import { useState } from 'react';
import { useAllowlist } from '../api/copilot/useAllowlist';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { AllowlistManagerContent } from './AllowlistManagerContent';

interface AllowlistManagerProps {
    onClose: () => void;
}

export function AllowlistManager({ onClose }: AllowlistManagerProps) {
    const { allowedTables, isFetching, removeTable, isRemoving } = useAllowlist();
    const { mutate: allowTable, isPending: isAdding } = useAllowTable();
    const [newTable, setNewTable] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTable.trim()) return;

        allowTable({ table: newTable.trim() }, {
            onSuccess: () => {
                setSuccessMsg(`Added '${newTable.trim()}' to allowlist.`);
                setNewTable('');
                setTimeout(() => setSuccessMsg(''), 3000);
            },
            onError: (err) => { alert(`Error: ${err.message}`); }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <AllowlistManagerContent
                allowedTables={allowedTables}
                isFetching={isFetching}
                isRemoving={isRemoving}
                isAdding={isAdding}
                newTable={newTable}
                successMsg={successMsg}
                onClose={onClose}
                onTableChange={setNewTable}
                onAdd={handleAdd}
                onRemove={(table) => {
                    removeTable(table, {
                        onSuccess: () => {
                            setSuccessMsg(`Removed '${table}'.`);
                            setTimeout(() => setSuccessMsg(''), 3000);
                        }
                    });
                }}
            />
        </div>
    );
}
