/* eslint-disable max-lines */
import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme explicitly for SQL
import { ResultsTable } from '../copilot/ResultsTable';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';

interface QueryWorkspaceProps {
    injectedSql: string;
    onResetInjectedSql: () => void;
}

export function QueryWorkspace({ injectedSql, onResetInjectedSql }: QueryWorkspaceProps) {
    const [sql, setSql] = useState<string>("SELECT * FROM public.users LIMIT 10;");
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [approvalTable, setApprovalTable] = useState<string | null>(null);
    
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();

    // Effect to catch incoming AI injected SQL
    if (injectedSql && injectedSql !== sql) {
        setSql(injectedSql);
        onResetInjectedSql(); // Clear it out of the layout prop so we can continuously edit
    }

    const handleRun = () => {
        if (!sql.trim()) return;
        setApprovalTable(null);
        runQuery({ query: sql, mode: 'sql' }, {
            onSuccess: (data) => {
                if (data.success) {
                    setTableResults(data.rows);
                } else if (data.requiresApproval) {
                    setApprovalTable(data.table);
                } else {
                    alert("Error running query: " + data.error);
                }
            },
            onError: (err) => {
                alert("Execution Error: " + err.message);
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white flex-1 min-w-0">
            {/* Top Bar Editor Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 text-sm ml-2">SQL Workspace</span>
                    <button 
                        onClick={handleRun}
                        disabled={isRunning || !sql.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isRunning ? '▶ Running...' : '▶ Run Query'}
                    </button>
                </div>
            </div>

            {/* Split View Container */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden">
                 {/* Top Half: Code Editor */}
                 <div className="flex-[0.4] overflow-y-auto border-b-4 border-slate-950 shadow-inner">
                    <Editor
                        value={sql}
                        onValueChange={code => setSql(code)}
                        highlight={code => Prism.highlight(code, Prism.languages.sql, 'sql')}
                        padding={16}
                        style={{
                            fontFamily: '"Fira Code", "JetBrains Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
                            fontSize: 14,
                            minHeight: '100%',
                            color: '#f8f8f2'
                        }}
                        textareaClassName="focus:outline-none"
                    />
                 </div>

                 {/* Bottom Half: Results Viewer */}
                 <div className="flex-[0.6] bg-slate-50 p-4 border-t border-slate-300 overflow-y-auto flex flex-col">
                     {approvalTable ? (
                         <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-50 text-red-800 rounded-lg border border-red-200 shadow-sm h-full max-w-2xl mx-auto my-auto self-center w-full">
                            <span className="text-3xl mb-3">⚠️</span>
                            <h3 className="font-bold text-lg mb-2">Table Not Allowed</h3>
                            <p className="mb-6 text-sm text-center text-red-700">The table <strong>{approvalTable}</strong> is not in the active allowlist. You must explicitly grant permission before execution.</p>
                            <button 
                                onClick={() => {
                                    allowTable({ table: approvalTable }, {
                                        onSuccess: () => {
                                            setApprovalTable(null);
                                            handleRun(); // Auto re-run
                                        },
                                        onError: (err) => alert(err.message)
                                    });
                                }}
                                disabled={isAllowing}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded shadow transition-colors disabled:opacity-50"
                            >
                                {isAllowing ? "Allowing..." : "Allow Table & Execute"}
                            </button>
                         </div>
                     ) : tableResults ? (
                         <ResultsTable tableResults={tableResults} onClear={() => setTableResults(null)} />
                     ) : (
                         <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
                            Execute a query to view tabular results...
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
}
