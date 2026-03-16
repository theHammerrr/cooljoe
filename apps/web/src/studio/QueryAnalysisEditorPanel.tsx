import { QueryWorkspaceEditor } from './QueryWorkspaceEditor';

interface QueryAnalysisEditorPanelProps {
    sql: string;
    onValueChange: (value: string) => void;
}

export function QueryAnalysisEditorPanel({ sql, onValueChange }: QueryAnalysisEditorPanelProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/6 bg-[#0d1117]">
            <div className="flex items-center justify-between border-b border-white/6 bg-[#161b22] px-4 py-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">SQL Editor</p>
                    <p className="mt-1 text-xs text-slate-400">Tune the query here, then run the dedicated analyzer.</p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-100">Desktop Analysis</span>
            </div>
            <QueryWorkspaceEditor activeTab="sql" height={360} onValueChange={onValueChange} value={sql} />
        </div>
    );
}
