import { StudioHeaderActions } from './StudioHeaderActions';

interface StudioTopBarProps {
    onOpenAllowlist: () => void;
    onOpenAnalytics: () => void;
    onResetLayout: () => void;
}

export function StudioTopBar({ onOpenAllowlist, onOpenAnalytics, onResetLayout }: StudioTopBarProps) {
    return (
        <header className="bg-[#161b22] border-b border-white/5 px-4 py-2.5 flex justify-between items-center shrink-0 z-10">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm text-slate-100 tracking-tight">AI Copilot Studio</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">v1.0</span>
            </div>
            <StudioHeaderActions
                onResetLayout={onResetLayout}
                onOpenAllowlist={onOpenAllowlist}
                onOpenAnalytics={onOpenAnalytics}
            />
        </header>
    );
}
