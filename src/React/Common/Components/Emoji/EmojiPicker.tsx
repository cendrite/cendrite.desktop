import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EmojiPicker as Picker, type EmojiPickerListComponents, type EmojiPickerListEmojiProps } from 'frimousse';
import { loadEmojiCatalog, resolveEmojiData } from '@/React/Common/Emoji/EmojiData';
import { useEmojiSettings } from '@/React/Context/Emoji/EmojiSettingsContext';
import { SkinToneMenu } from './SkinToneMenu';

const MAX_RECENT_SHOWN = 18;
const LONG_PRESS_MS = 400;
const MENU_WIDTH = 200;
const MENU_HEIGHT = 40;
const MENU_GAP = 4;

type SkinToneContextType = {
    skinTones: Readonly<Record<string, string>>;
    skinVariants: Map<string, string[]>;
    // Returns whether a menu opened, i.e. whether the emoji has skin tone variants.
    openSkinTones: (emoji: string, anchor: HTMLElement) => boolean;
};

const SkinToneContext = createContext<SkinToneContextType>({
    skinTones: {},
    skinVariants: new Map(),
    openSkinTones: () => false,
});

const EmojiButton: React.FC<EmojiPickerListEmojiProps> = ({
    emoji,
    onClick,
    onPointerDown,
    onPointerLeave,
    ...props
}) => {
    const { skinTones, skinVariants, openSkinTones } = useContext(SkinToneContext);
    const timer = useRef<number>(undefined);
    const longPressed = useRef(false);

    const cancelPress = () => window.clearTimeout(timer.current);

    useEffect(() => cancelPress, []);

    return (
        <button
            className="relative flex size-8 items-center justify-center rounded-md text-xl data-[active]:bg-surface-hover"
            {...props}
            onClick={(e) => {
                // The click that ends a long press must not also insert the emoji.
                if (longPressed.current) {
                    longPressed.current = false;
                    return;
                }
                onClick?.(e);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                openSkinTones(emoji.emoji, e.currentTarget);
            }}
            onPointerDown={(e) => {
                onPointerDown?.(e);
                if (e.button !== 0) return;
                const target = e.currentTarget;
                longPressed.current = false;
                cancelPress();
                timer.current = window.setTimeout(() => {
                    longPressed.current = openSkinTones(emoji.emoji, target);
                }, LONG_PRESS_MS);
            }}
            onPointerUp={cancelPress}
            onPointerLeave={(e) => {
                cancelPress();
                onPointerLeave?.(e);
            }}
        >
            {skinTones[emoji.emoji] ?? emoji.emoji}
            {skinVariants.has(emoji.emoji) && (
                <span className="absolute right-0.5 bottom-0.5 size-0 border-b-4 border-l-4 border-b-fg-faint border-l-transparent" />
            )}
        </button>
    );
};

const listComponents: Partial<EmojiPickerListComponents> = {
    CategoryHeader: ({ category, ...props }) => (
        <div className="bg-overlay px-3 pt-3 pb-1.5 text-xs font-medium text-fg-subtle" {...props}>
            {category.label}
        </div>
    ),
    Row: ({ children, ...props }) => (
        <div className="scroll-my-1.5 px-1.5" {...props}>
            {children}
        </div>
    ),
    Emoji: EmojiButton,
};

type SkinToneMenuState = {
    variants: string[];
    position: { left: number; top: number };
};

export interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, className }) => {
    const { skinTones, setSkinTone, recent } = useEmojiSettings();
    const [search, setSearch] = useState('');
    const [skinVariants, setSkinVariants] = useState<Map<string, string[]>>(new Map());
    const [skinToneMenu, setSkinToneMenu] = useState<SkinToneMenuState | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const recentShown = search ? [] : recent.slice(0, MAX_RECENT_SHOWN);

    useEffect(() => {
        let cancelled = false;
        loadEmojiCatalog()
            .then((catalog) => !cancelled && setSkinVariants(catalog.skinVariants))
            .catch((error) => console.error('Could not load emoji skin tones', error));
        return () => {
            cancelled = true;
        };
    }, []);

    const openSkinTones = useCallback(
        (emoji: string, anchor: HTMLElement) => {
            const variants = skinVariants.get(emoji);
            const root = rootRef.current;
            if (!variants || !root) return false;

            const rootRect = root.getBoundingClientRect();
            const anchorRect = anchor.getBoundingClientRect();
            const centre = anchorRect.left + anchorRect.width / 2 - rootRect.left;
            const above = anchorRect.top - rootRect.top - MENU_HEIGHT - MENU_GAP;
            setSkinToneMenu({
                variants,
                position: {
                    left: Math.min(Math.max(centre - MENU_WIDTH / 2, MENU_GAP), rootRect.width - MENU_WIDTH - MENU_GAP),
                    top: above >= 0 ? above : anchorRect.bottom - rootRect.top + MENU_GAP,
                },
            });
            return true;
        },
        [skinVariants],
    );

    const closeSkinTones = useCallback(() => setSkinToneMenu(null), []);

    const skinToneContext = useMemo(
        () => ({ skinTones, skinVariants, openSkinTones }),
        [skinTones, skinVariants, openSkinTones],
    );

    return (
        <Picker.Root
            ref={rootRef}
            className={`relative isolate flex h-[420px] w-fit flex-col bg-overlay ${className ?? ''}`}
            columns={9}
            resolveEmojiData={resolveEmojiData}
            onEmojiSelect={({ emoji }) => onEmojiSelect(skinTones[emoji] ?? emoji)}
        >
            <Picker.Search
                autoFocus
                placeholder="Search emoji"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="z-10 mx-2 mt-2 appearance-none rounded-md bg-field px-2.5 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none"
            />
            {recentShown.length > 0 && (
                <div className="flex-none border-b border-line pb-1.5">
                    <div className="px-3 pt-3 pb-1.5 text-xs font-medium text-fg-subtle">Recently used</div>
                    <div className="grid grid-cols-9 px-1.5">
                        {recentShown.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                aria-label={emoji}
                                onClick={() => onEmojiSelect(emoji)}
                                onPointerDown={(e) => e.preventDefault()}
                                className="flex size-8 items-center justify-center rounded-md text-xl hover:bg-surface-hover"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <Picker.Viewport className="relative flex-1 outline-none">
                <Picker.Loading className="absolute inset-0 flex items-center justify-center text-sm text-fg-faint">
                    Loading…
                </Picker.Loading>
                <Picker.Empty className="absolute inset-0 flex items-center justify-center text-sm text-fg-faint">
                    No emoji found
                </Picker.Empty>
                <SkinToneContext.Provider value={skinToneContext}>
                    <Picker.List className="select-none pb-1.5" components={listComponents} />
                </SkinToneContext.Provider>
            </Picker.Viewport>
            <div className="flex h-10 w-full min-w-0 max-w-[--frimousse-viewport-width] flex-none items-center gap-1 border-t border-line px-2">
                <Picker.ActiveEmoji>
                    {({ emoji }) =>
                        emoji ? (
                            <>
                                <span className="flex size-7 flex-none items-center justify-center text-lg">
                                    {skinTones[emoji.emoji] ?? emoji.emoji}
                                </span>
                                <span className="truncate text-xs text-fg-muted">{emoji.label}</span>
                            </>
                        ) : (
                            <span className="ml-1.5 truncate text-xs text-fg-faint">Select an emoji…</span>
                        )
                    }
                </Picker.ActiveEmoji>
            </div>
            {skinToneMenu && (
                <SkinToneMenu
                    variants={skinToneMenu.variants}
                    position={skinToneMenu.position}
                    onSelect={(emoji) => {
                        setSkinTone(skinToneMenu.variants[0], emoji);
                        closeSkinTones();
                        onEmojiSelect(emoji);
                    }}
                    onClose={closeSkinTones}
                />
            )}
        </Picker.Root>
    );
};

export default EmojiPicker;
