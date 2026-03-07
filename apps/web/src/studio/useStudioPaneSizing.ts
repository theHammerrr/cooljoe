import { useCallback, useEffect, useState } from 'react';

const LEFT_KEY = 'cooljoe.studio.leftPaneWidth';
const RIGHT_KEY = 'cooljoe.studio.rightPaneWidth';
const DEFAULT_LEFT = 240;
const DEFAULT_RIGHT = 400;
const MIN_LEFT = 220;
const MAX_LEFT = 420;
const MIN_RIGHT = 320;
const MAX_RIGHT = 560;
const MIN_CENTER = 520;
const HANDLE_WIDTH = 12;
const KEYBOARD_STEP = 20;

export function useStudioPaneSizing() {
    const [leftWidth, setLeftWidth] = useState(() => loadStoredSize(LEFT_KEY, DEFAULT_LEFT));
    const [rightWidth, setRightWidth] = useState(() => loadStoredSize(RIGHT_KEY, DEFAULT_RIGHT));

    useEffect(() => {
        saveStoredSize(LEFT_KEY, leftWidth);
    }, [leftWidth]);

    useEffect(() => {
        saveStoredSize(RIGHT_KEY, rightWidth);
    }, [rightWidth]);

    const startLeftResize = useCallback((event: React.MouseEvent<HTMLDivElement>, container: HTMLDivElement | null) => {
        if (!container) return;

        event.preventDefault();
        const rect = container.getBoundingClientRect();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const available = rect.width - rightWidth - MIN_CENTER - HANDLE_WIDTH * 2;
            const nextWidth = clamp(moveEvent.clientX - rect.left, MIN_LEFT, Math.min(MAX_LEFT, available));

            setLeftWidth(nextWidth);
        };

        bindDragListeners(handleMouseMove);
    }, [rightWidth]);

    const startRightResize = useCallback((event: React.MouseEvent<HTMLDivElement>, container: HTMLDivElement | null) => {
        if (!container) return;

        event.preventDefault();
        const rect = container.getBoundingClientRect();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const available = rect.width - leftWidth - MIN_CENTER - HANDLE_WIDTH * 2;
            const nextWidth = clamp(rect.right - moveEvent.clientX, MIN_RIGHT, Math.min(MAX_RIGHT, available));

            setRightWidth(nextWidth);
        };

        bindDragListeners(handleMouseMove);
    }, [leftWidth]);

    const resetLeftWidth = useCallback(() => {
        setLeftWidth(DEFAULT_LEFT);
    }, []);

    const resetRightWidth = useCallback(() => {
        setRightWidth(DEFAULT_RIGHT);
    }, []);

    const adjustLeftWidth = useCallback((delta: number) => {
        setLeftWidth((current) => clamp(current + delta, MIN_LEFT, MAX_LEFT));
    }, []);

    const adjustRightWidth = useCallback((delta: number) => {
        setRightWidth((current) => clamp(current - delta, MIN_RIGHT, MAX_RIGHT));
    }, []);

    const resetLayoutWidths = useCallback(() => {
        setLeftWidth(DEFAULT_LEFT);
        setRightWidth(DEFAULT_RIGHT);
    }, []);

    return {
        leftWidth,
        rightWidth,
        startLeftResize,
        startRightResize,
        resetLeftWidth,
        resetRightWidth,
        adjustLeftWidth,
        adjustRightWidth,
        resetLayoutWidths,
        keyboardStep: KEYBOARD_STEP
    };
}

function bindDragListeners(handleMouseMove: (event: MouseEvent) => void) {
    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}

function loadStoredSize(key: string, fallback: number): number {
    if (typeof window === 'undefined') return fallback;
    const rawValue = window.localStorage.getItem(key);
    const parsedValue = rawValue ? Number(rawValue) : NaN;

    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function saveStoredSize(key: string, value: number) {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(key, String(Math.round(value)));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
