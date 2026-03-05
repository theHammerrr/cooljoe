import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';
import { ResultsTable } from '../copilot/ResultsTable';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { QueryWorkspaceApproval } from './QueryWorkspaceApproval';

interface QueryWorkspaceProps {
    injectedSql: string;
    onResetInjectedSql: () => void;
}

export function QueryWorkspace({ injectedSql, onResetInjectedSql }: QueryWorkspaceProps) {
    const [sql, setSql] = useState<string>('SELECT * FROM public.users LIMIT 10;');
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [approvalTable, setApprovalTable] = useState<string | null>(null);
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();

    const effectiveSql = injectedSql || sql;

    const handleRun = () => {
        if (!effectiveSql.trim()) return;
        setApprovalTable(null);
        runQuery({ query: effectiveSql, mode: 'sql' }, {
            onSuccess: (data) => data.success ? setTableResults(data.rows) : data.requiresApproval ? setApprovalTable(data.table) : alert(`Error running query: ${data.error}`),
            onError: (err) => alert(`Execution Error: ${err.message}`)
        });
    };

    return (
        <div className="flex flex-col h-full bg-white flex-1 min-w-0">
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 text-sm ml-2">SQL Workspace</span>
                    <button onClick={handleRun} disabled={isRunning || !effectiveSql.trim()} className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                        {isRunning ? 'Running...' : 'Run Query'}
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden">
                <div className="flex-[0.4] overflow-y-auto border-b-4 border-slate-950 shadow-inner">
                    <Editor value={effectiveSql} onValueChange={(code) => { if (injectedSql) onResetInjectedSql(); setSql(code); }} highlight={(code) => Prism.highlight(code, Prism.languages.sql, 'sql')} padding={16}
                        style={{ fontFamily: '"Fira Code", "JetBrains Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace', fontSize: 14, minHeight: '100%', color: '#f8f8f2' }}
                        textareaClassName="focus:outline-none" />
                </div>
                <div className="flex-[0.6] bg-slate-50 p-4 border-t border-slate-300 overflow-y-auto flex flex-col">
                    {approvalTable ? (
                        <QueryWorkspaceApproval approvalTable={approvalTable} isAllowing={isAllowing} onApprove={() => allowTable({ table: approvalTable }, { onSuccess: () => { setApprovalTable(null); handleRun(); }, onError: (err) => alert(err.message) })} />
                    ) : tableResults ? (
                        <ResultsTable tableResults={tableResults} onClear={() => setTableResults(null)} />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">Execute a query to view tabular results...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
