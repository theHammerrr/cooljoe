import { useState } from 'react';
import { ResultsTable } from '../copilot/ResultsTable';
import { useRunQuery } from '../api/copilot/useRunQuery';
import { useAllowTable } from '../api/copilot/useAllowTable';
import { QueryWorkspaceApproval } from './QueryWorkspaceApproval';
import { QueryWorkspaceHeader } from './QueryWorkspaceHeader';
import { QueryWorkspaceEditor } from './QueryWorkspaceEditor';
import { QueryWorkspaceEmptyState } from './QueryWorkspaceEmptyState';
import { QueryWorkspaceFooter } from './QueryWorkspaceFooter';

interface QueryWorkspaceProps {
    injectedSql: string;
    injectedPrisma?: string;
    onResetInjected: () => void;
}

export function QueryWorkspace({ injectedSql, injectedPrisma, onResetInjected }: QueryWorkspaceProps) {
    const [sql, setSql] = useState<string>('SELECT * FROM public.users LIMIT 10;');
    const [prismaJs, setPrismaJs] = useState<string>('prisma.users.findMany({\n  take: 10\n})');
    const [activeTab, setActiveTab] = useState<'sql' | 'prisma'>('sql');
    const [tableResults, setTableResults] = useState<Record<string, unknown>[] | null>(null);
    const [approvalTable, setApprovalTable] = useState<string | null>(null);
    const { mutate: runQuery, isPending: isRunning } = useRunQuery();
    const { mutate: allowTable, isPending: isAllowing } = useAllowTable();

    const effectiveSql = injectedSql || sql;
    const effectivePrisma = injectedPrisma || prismaJs;

    const handleRun = () => {
        if (!effectiveSql.trim()) return;
        setApprovalTable(null);
        runQuery({ query: effectiveSql, mode: 'sql' }, {
            onSuccess: (d) => d.success ? setTableResults(d.rows) : d.requiresApproval ? setApprovalTable(d.table) : console.error(d.error),
            onError: (err) => console.error(err.message)
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] flex-1 min-w-0 text-slate-300 font-sans selection:bg-blue-500/30">
            <QueryWorkspaceHeader 
                activeTab={activeTab} onTabChange={setActiveTab} onRun={handleRun} 
                isRunning={isRunning} canRun={!!effectiveSql.trim()} 
            />
            <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117] overflow-hidden">
                <QueryWorkspaceEditor 
                    value={activeTab === 'sql' ? effectiveSql : effectivePrisma}
                    onValueChange={(code) => { 
                        if (activeTab === 'sql') {
                            if (injectedSql) onResetInjected();
                            setSql(code);
                        } else {
                            if (injectedPrisma) onResetInjected();
                            setPrismaJs(code);
                        }
                    }}
                    activeTab={activeTab}
                />
                <div className="flex-[0.55] bg-[#0d1117] overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                        {approvalTable ? (
                            <div className="my-auto animate-in fade-in zoom-in-95 duration-700">
                                <QueryWorkspaceApproval 
                                    approvalTable={approvalTable} isAllowing={isAllowing} 
                                    onApprove={() => allowTable({ table: approvalTable }, { onSuccess: () => { setApprovalTable(null); handleRun(); } })} 
                                />
                            </div>
                        ) : tableResults ? (
                            <ResultsTable tableResults={tableResults} onClear={() => setTableResults(null)} />
                        ) : (
                            <QueryWorkspaceEmptyState activeTab={activeTab} />
                        )}
                    </div>
                </div>
            </div>
            <QueryWorkspaceFooter />
        </div>
    );
}
