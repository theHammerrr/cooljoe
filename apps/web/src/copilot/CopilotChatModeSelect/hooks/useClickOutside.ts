import { useEffect } from "react";

export const useClickOutside = ({ containerRef, callback }: { containerRef: React.RefObject<HTMLElement | null>, callback: () => void }) => {
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target instanceof Node)) return;

            if (containerRef.current && !containerRef.current.contains(e.target)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [callback, containerRef]);
}
