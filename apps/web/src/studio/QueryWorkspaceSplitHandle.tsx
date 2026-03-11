import { ResizeHandle } from './ResizeHandle';

interface QueryWorkspaceSplitHandleProps {
    onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
    onReset: () => void;
    onAdjust: (delta: number) => void;
}

export function QueryWorkspaceSplitHandle({ onMouseDown, onReset, onAdjust }: QueryWorkspaceSplitHandleProps) {
    return (
        <ResizeHandle
            orientation="vertical"
            onMouseDown={onMouseDown}
            onDoubleClick={onReset}
            onAdjust={onAdjust}
        />
    );
}
