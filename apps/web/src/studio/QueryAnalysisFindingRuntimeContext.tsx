import type { QueryAnalysisFindingRuntimeContext } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisFindingRuntimeContextProps {
    runtimeContext: QueryAnalysisFindingRuntimeContext;
    isSelected: boolean;
    onSelectNode: (nodeId: string) => void;
}

export function QueryAnalysisFindingRuntimeContext({
    runtimeContext,
    isSelected,
    onSelectNode
}: QueryAnalysisFindingRuntimeContextProps) {
    return (
        <div className="mt-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/80">Estimated Vs Actual</p>
                <button
                    type="button"
                    onClick={() => onSelectNode(runtimeContext.nodeId)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isSelected
                            ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100'
                            : 'border-white/10 bg-black/20 text-slate-300 hover:text-slate-100'
                    }`}
                >
                    {isSelected ? 'Selected Node' : 'Focus Node'}
                </button>
            </div>
            <div className="mt-2 grid gap-2 text-sm text-emerald-50 sm:grid-cols-2">
                <RuntimeMetric label="Node ID" value={runtimeContext.nodeId} />
                <RuntimeMetric label="Plan node" value={runtimeContext.nodeType} />
                <RuntimeMetric label="Estimated rows" value={formatNumber(runtimeContext.estimatedRows)} />
                <RuntimeMetric label="Actual rows" value={formatNumber(runtimeContext.actualRows)} />
                <RuntimeMetric label="Actual loops" value={formatNumber(runtimeContext.actualLoops)} />
                <RuntimeMetric label="Actual time" value={formatDuration(runtimeContext.actualTotalTimeMs)} />
                <RuntimeMetric label="Drift ratio" value={formatRatio(runtimeContext.driftRatio)} />
            </div>
        </div>
    );
}

function RuntimeMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-white/5 bg-black/20 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/60">{label}</p>
            <p className="mt-1 text-sm text-emerald-50">{value}</p>
        </div>
    );
}

function formatNumber(value: number | undefined): string {
    return typeof value === 'number' ? Intl.NumberFormat('en-US').format(Math.round(value)) : 'n/a';
}

function formatDuration(value: number | undefined): string {
    return typeof value === 'number' ? `${value.toFixed(3)} ms` : 'n/a';
}

function formatRatio(value: number | undefined): string {
    return typeof value === 'number' ? `${value.toFixed(1)}x` : 'n/a';
}
