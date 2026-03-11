interface ResizeHandleProps {
    orientation: 'horizontal' | 'vertical';
    onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
    onDoubleClick?: () => void;
    onAdjust?: (delta: number) => void;
}

export function ResizeHandle({ orientation, onMouseDown, onDoubleClick, onAdjust }: ResizeHandleProps) {
    if (orientation === 'horizontal') {
        return (
            <div
                onMouseDown={onMouseDown}
                onDoubleClick={onDoubleClick}
                onKeyDown={(event) => handleResizeKeyDown(event, orientation, onAdjust, onDoubleClick)}
                className="group relative z-20 flex w-3 shrink-0 cursor-col-resize items-stretch justify-center bg-transparent"
                role="separator"
                aria-orientation="vertical"
                tabIndex={0}
                title="Drag to resize. Double-click to reset."
            >
                <div className="my-2 w-px rounded-full bg-white/6 transition-colors duration-200 group-hover:bg-emerald-400/60" />
                <div className="pointer-events-none absolute inset-y-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1 rounded-full border border-white/8 bg-[#161b22]/80 px-1 py-1 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 group-hover:opacity-100">
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                </div>
                <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2" />
            </div>
        );
    }

    return (
        <div
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            onKeyDown={(event) => handleResizeKeyDown(event, orientation, onAdjust, onDoubleClick)}
            className="group relative z-20 flex h-3 shrink-0 cursor-row-resize items-center justify-center bg-transparent"
            role="separator"
            aria-orientation="horizontal"
            tabIndex={0}
            title="Drag to resize. Double-click to reset."
        >
            <div className="h-px w-full rounded-full bg-white/6 transition-colors duration-200 group-hover:bg-emerald-400/60" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1 rounded-full border border-white/8 bg-[#161b22]/80 px-2 py-1 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 group-hover:opacity-100">
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="h-1 w-1 rounded-full bg-white/30" />
            </div>
            <div className="absolute left-0 right-0 top-1/2 h-6 -translate-y-1/2" />
        </div>
    );
}

function handleResizeKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    orientation: ResizeHandleProps['orientation'],
    onAdjust?: (delta: number) => void,
    onDoubleClick?: () => void
) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onDoubleClick?.();

        return;
    }

    if (!onAdjust) return;
    const step = event.shiftKey ? 40 : 20;

    if (orientation === 'horizontal') {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onAdjust(-step);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            onAdjust(step);
        }

        return;
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        onAdjust(-step);
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        onAdjust(step);
    }
}
