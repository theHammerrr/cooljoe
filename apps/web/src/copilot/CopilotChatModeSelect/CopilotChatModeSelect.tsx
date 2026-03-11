import { useState, useRef } from 'react';
import { MODES } from './const';
import type { CopilotChatModeSelectProps } from './types';
import type { ComposeMode } from '../composeState';
import { useClickOutside } from './hooks/useClickOutside';

export function CopilotChatModeSelect({ disabled, mode, onChange }: CopilotChatModeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentMode = MODES.find((m) => m.value === mode) || MODES[0];

    // Close on outside click
    useClickOutside({ containerRef, callback: () => setIsOpen(false) });

    const handleSelect = (value: ComposeMode) => {
        onChange(value);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative shrink-0" style={{ minWidth: '120px' }}>
            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg
                           bg-[#0d1117] border border-white/10
                           hover:border-[#4ade80]/60 transition-colors duration-150
                           disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed outline-none
                           focus-visible:border-[#4ade80]/60"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentMode.dotColor, boxShadow: `0 0 5px ${currentMode.dotColor}` }}
                    />
                    <span className="font-mono text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        {currentMode.label}
                    </span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    className="absolute bottom-full mb-1 left-0 z-50 min-w-full
                               bg-[#0d1117] border border-[#4ade80]/30 rounded-lg overflow-hidden
                               shadow-[0_0_20px_rgba(74,222,128,0.08)]"
                    role="listbox"
                >
                    {MODES.map((item) => {
                        const isSelected = item.value === mode;

                        return (
                            <button
                                key={item.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSelect(item.value)}
                                className={`w-full flex items-center justify-between px-3 py-2 gap-3
                                            font-mono text-[11px] uppercase tracking-wider
                                            transition-colors duration-100 outline-none
                                            ${isSelected
                                                ? 'bg-white/5 text-slate-200'
                                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                                            }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{
                                            backgroundColor: item.dotColor,
                                            boxShadow: isSelected ? `0 0 5px ${item.dotColor}` : undefined,
                                            opacity: isSelected ? 1 : 0.5,
                                        }}
                                    />
                                    <span>{item.label}</span>
                                </div>
                                {isSelected && (
                                    <svg className="w-3 h-3 text-[#4ade80] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
