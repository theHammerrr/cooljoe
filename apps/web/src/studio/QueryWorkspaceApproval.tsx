interface QueryWorkspaceApprovalProps {
    approvalTable: string;
    isAllowing: boolean;
    onApprove: () => void;
}

export function QueryWorkspaceApproval({ approvalTable, isAllowing, onApprove }: QueryWorkspaceApprovalProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-50 text-red-800 rounded-lg border border-red-200 shadow-sm h-full max-w-2xl mx-auto my-auto self-center w-full">
            <span className="text-3xl mb-3">!</span>
            <h3 className="font-bold text-lg mb-2">Table Not Allowed</h3>
            <p className="mb-6 text-sm text-center text-red-700">
                The table <strong>{approvalTable}</strong> is not in the active allowlist. You must explicitly grant permission before execution.
            </p>
            <button onClick={onApprove} disabled={isAllowing} className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded shadow transition-colors disabled:opacity-50">
                {isAllowing ? 'Allowing...' : 'Allow Table & Execute'}
            </button>
        </div>
    );
}
