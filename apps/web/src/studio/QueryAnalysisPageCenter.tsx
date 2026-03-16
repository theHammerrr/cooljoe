import type { QueryAnalysisResult } from '../api/copilot/useAnalyzeQuery';

interface QueryAnalysisPageCenterProps {
    analysis: QueryAnalysisResult | null;
    analysisError: string | null;
}

export function QueryAnalysisPageCenter({ analysis, analysisError }: QueryAnalysisPageCenterProps) {
    if (!analysis) {
        return <EmptyPanel text="This center panel will show normalized SQL, safety notes, and the advisory AI block once the analyzer runs." />;
    }

    return (
        <div className="space-y-4">
            {analysisError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {analysisError}
                </div>
            )}
            <div className="rounded-xl border border-white/6 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Context Strip</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ContextStat label="Referenced Tables" value={analysis.referencedTables.join(', ') || 'None'} />
                    <ContextStat label="Analysis Mode" value={analysis.mode === 'explain_analyze' ? 'Execution backed' : 'Planner only'} />
                    <ContextStat label="Indexes Seen" value={String(analysis.indexes.length)} />
                    <ContextStat label="Safety Notes" value={String(analysis.safetyNotes.length)} />
                </div>
            </div>
            {analysis.safetyNotes.map((note) => (
                <div key={note} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    {note}
                </div>
            ))}
            <section className="rounded-xl border border-white/6 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Normalized SQL</p>
                <pre className="mt-3 overflow-auto rounded-lg border border-white/6 bg-black/30 p-3 text-xs text-slate-200">
                    <code>{analysis.normalizedSql}</code>
                </pre>
            </section>
        </div>
    );
}

function ContextStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/6 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm text-slate-200">{value}</p>
        </div>
    );
}

function EmptyPanel({ text }: { text: string }) {
    return (
        <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 px-6 py-8 text-center text-sm text-slate-500">
            {text}
        </div>
    );
}
