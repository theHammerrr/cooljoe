import { StudioPageSwitch } from './StudioPageSwitch';
import { StudioHeaderActions } from './StudioHeaderActions';

interface StudioTopBarProps {
    activePage: 'workspace' | 'analysis';
    allowlistEnabled: boolean;
    onOpenAllowlist: () => void;
    onOpenAnalytics: () => void;
    onPageChange: (page: 'workspace' | 'analysis') => void;
    onResetLayout: () => void;
}

export function StudioTopBar({
    activePage,
    onOpenAllowlist,
    onOpenAnalytics,
    onPageChange,
    onResetLayout
}: StudioTopBarProps) {
export function StudioTopBar({ allowlistEnabled, onOpenAllowlist, onOpenAnalytics, onResetLayout }: StudioTopBarProps) {
    return (
        <header className="bg-[#161b22] border-b border-white/5 px-4 py-2.5 flex justify-between items-center shrink-0 z-10">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="7" fill="#0d1117"/>
                        <ellipse cx="16" cy="9" rx="8" ry="3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                        <line x1="8" y1="9" x2="8" y2="23" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                        <line x1="24" y1="9" x2="24" y2="23" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                        <ellipse cx="16" cy="23" rx="8" ry="3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M8 16 Q16 18.5 24 16" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                        <polyline points="18,7 13,16 17,16 14,25" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                    </svg>
                    <span className="font-bold text-[15px] tracking-tight select-none">
                        <span className="text-slate-100">Cool</span><span className="text-emerald-400">Joe</span>
                    </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">v1.0</span>
                <StudioPageSwitch activePage={activePage} onPageChange={onPageChange} />
            </div>
            <StudioHeaderActions
                allowlistEnabled={allowlistEnabled}
                onResetLayout={onResetLayout}
                onOpenAllowlist={onOpenAllowlist}
                onOpenAnalytics={onOpenAnalytics}
            />
        </header>
    );
}
