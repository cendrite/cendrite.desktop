import React, { useEffect, useRef } from 'react';

export interface SkinToneMenuProps {
    variants: string[];
    position: { left: number; top: number };
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export const SkinToneMenu: React.FC<SkinToneMenuProps> = ({ variants, position, onSelect, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) onClose();
        };
        // Captured on window so Escape closes only this menu, not the picker popover around it.
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            onClose();
        };
        window.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
            window.removeEventListener('pointerdown', onPointerDown, true);
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }, [onClose]);

    return (
        <div
            ref={ref}
            role="menu"
            style={position}
            className="absolute z-20 flex rounded-lg bg-overlay p-1 shadow-lg ring-1 ring-line"
        >
            {variants.map((variant) => (
                <button
                    key={variant}
                    type="button"
                    role="menuitem"
                    onClick={() => onSelect(variant)}
                    onPointerDown={(e) => e.preventDefault()}
                    className="flex size-8 items-center justify-center rounded-md text-xl hover:bg-surface-hover"
                >
                    {variant}
                </button>
            ))}
        </div>
    );
};

export default SkinToneMenu;
