import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';

interface QueryAnalysisPlanMetricsGridProps {
    node: QueryAnalysisPlanNode;
}

export function QueryAnalysisPlanMetricsGrid({ node }: QueryAnalysisPlanMetricsGridProps) {
    const groups = [
        {
            title: 'Rows',
            items: [
                ['Estimated', formatNumber(node.planRows)],
                ['Actual', formatNumber(node.actualRows)],
                ['Loops', formatNumber(node.actualLoops)]
            ]
        },
        {
            title: 'Cost & Time',
            items: [
                ['Startup', formatDecimal(node.startupCost)],
                ['Total cost', formatDecimal(node.totalCost)],
                ['Actual time', formatMilliseconds(node.actualTotalTime)]
            ]
        },
        {
            title: 'Buffers',
            items: [
                ['Shared hit', formatNumber(node.buffers?.sharedHitBlocks)],
                ['Shared read', formatNumber(node.buffers?.sharedReadBlocks)],
                ['Temp written', formatNumber(node.buffers?.tempWrittenBlocks)]
            ]
        }
    ];

    return (
        <div className="grid gap-3 md:grid-cols-3">
            {groups.map((group) => (
                <div key={group.title} className="rounded-xl border border-white/6 bg-black/20 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{group.title}</p>
                    <div className="mt-3 space-y-2 text-sm">
                        {group.items.map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-slate-300">
                                <span className="text-slate-500">{label}</span>
                                <span className="font-medium text-slate-100">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatNumber(value?: number): string {
    return typeof value === 'number' ? value.toLocaleString() : '—';
}

function formatDecimal(value?: number): string {
    return typeof value === 'number' ? value.toFixed(2) : '—';
}

function formatMilliseconds(value?: number): string {
    return typeof value === 'number' ? `${value.toFixed(3)} ms` : '—';
}
