interface QueryWorkspaceTabSwitchProps {
    activeTab: 'sql' | 'prisma';
    onTabChange: (tab: 'sql' | 'prisma') => void;
}

export function QueryWorkspaceTabSwitch({ activeTab, onTabChange }: QueryWorkspaceTabSwitchProps) {
    return (
        <div className="flex items-center p-1 bg-black/20 rounded-lg border border-white/5">
            <WorkspaceTabButton active={activeTab === 'sql'} dotClassName="bg-emerald-500" inactiveDotClassName="bg-slate-700" label="SQL" onClick={() => onTabChange('sql')} />
            <WorkspaceTabButton active={activeTab === 'prisma'} dotClassName="bg-violet-500" inactiveDotClassName="bg-slate-700" label="PRISMA" onClick={() => onTabChange('prisma')} />
        </div>
    );
}

function WorkspaceTabButton({
    active,
    dotClassName,
    inactiveDotClassName,
    label,
    onClick
}: {
    active: boolean;
    dotClassName: string;
    inactiveDotClassName: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 text-[11px] font-bold tracking-tight rounded-md transition-all duration-300 flex items-center gap-2.5 ${active ? 'bg-white text-slate-900 border border-white/80 shadow-sm' : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300 hover:bg-slate-800/60'}`}
        >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${active ? dotClassName : inactiveDotClassName}`}></div>
            {label}
        </button>
    );
}
