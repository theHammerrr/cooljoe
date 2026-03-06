export function QueryWorkspaceFooter() {
    return (
        <div className="h-7 bg-[#161b22] border-t border-white/5 flex items-center px-4 justify-between select-none shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Connected</span>
                </div>
                <div className="w-px h-3 bg-white/5"></div>
                <span className="text-[10px] font-medium text-slate-600 font-mono">UTF-8</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600">
                <span className="text-[10px] font-bold uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Line 1, Col 1</span>
                <span className="text-[10px] font-bold uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Spaces: 2</span>
            </div>
        </div>
    );
}
