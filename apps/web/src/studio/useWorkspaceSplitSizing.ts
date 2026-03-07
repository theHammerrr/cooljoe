import { useCallback, useEffect, useState } from 'react';

const EDITOR_HEIGHT_KEY = 'cooljoe.studio.editorHeight';
const DEFAULT_EDITOR = 320;
const MIN_EDITOR = 180;
const MIN_RESULTS = 180;
const KEYBOARD_STEP = 20;

export function useWorkspaceSplitSizing() {
    const [editorHeight, setEditorHeight] = useState(() => loadStoredHeight());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        window.localStorage.setItem(EDITOR_HEIGHT_KEY, String(Math.round(editorHeight)));
    }, [editorHeight]);

    const startResize = useCallback((event: React.MouseEvent<HTMLDivElement>, container: HTMLDivElement | null) => {
        if (!container) return;

        event.preventDefault();
        const rect = container.getBoundingClientRect();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const maxEditor = rect.height - MIN_RESULTS - 12;
            const nextHeight = clamp(moveEvent.clientY - rect.top, MIN_EDITOR, maxEditor);

            setEditorHeight(nextHeight);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, []);

    const resetEditorHeight = useCallback(() => {
        setEditorHeight(DEFAULT_EDITOR);
    }, []);

    const adjustEditorHeight = useCallback((delta: number) => {
        setEditorHeight((current) => Math.max(MIN_EDITOR, current + delta));
    }, []);

    return { editorHeight, startResize, resetEditorHeight, adjustEditorHeight, keyboardStep: KEYBOARD_STEP };
}

function loadStoredHeight(): number {
    if (typeof window === 'undefined') return DEFAULT_EDITOR;
    const rawValue = window.localStorage.getItem(EDITOR_HEIGHT_KEY);
    const parsedValue = rawValue ? Number(rawValue) : NaN;

    return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_EDITOR;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
