export function QueryAnalysisPlanTreeLegend() {
    return (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-cyan-100">Selected Path</span>
            <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-100">High Pressure</span>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-amber-100">Watch Node</span>
        </div>
    );
}
