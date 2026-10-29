import React, { useState } from 'react';
import { EmojiPicker as Picker, type EmojiPickerListComponents } from 'frimousse';
import { resolveEmojiData } from '@/React/Common/Emoji/EmojiData';
import { useEmojiSettings } from '@/React/Context/Emoji/EmojiSettingsContext';
import { SKIN_TONES } from '@/React/Context/Emoji/EmojiSettingsProvider';

const MAX_RECENT_SHOWN = 18;

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
    Emoji: ({ emoji, ...props }) => (
        <button
            className="flex size-8 items-center justify-center rounded-md text-xl data-[active]:bg-surface-hover"
            {...props}
        >
            {emoji.emoji}
        </button>
    ),
};

export interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, className }) => {
    const { skinTone, setSkinTone, recent } = useEmojiSettings();
    const [search, setSearch] = useState('');
    const recentShown = search ? [] : recent.slice(0, MAX_RECENT_SHOWN);

    const cycleSkinTone = () => setSkinTone(SKIN_TONES[(SKIN_TONES.indexOf(skinTone) + 1) % SKIN_TONES.length]);

    return (
        <Picker.Root
            className={`isolate flex h-[420px] w-fit flex-col bg-overlay ${className ?? ''}`}
            columns={9}
            skinTone={skinTone}
            resolveEmojiData={resolveEmojiData}
            onEmojiSelect={({ emoji }) => onEmojiSelect(emoji)}
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
                <Picker.List className="select-none pb-1.5" components={listComponents} />
            </Picker.Viewport>
            <div className="flex h-10 w-full min-w-0 max-w-[--frimousse-viewport-width] flex-none items-center gap-1 border-t border-line px-2">
                <Picker.ActiveEmoji>
                    {({ emoji }) =>
                        emoji ? (
                            <>
                                <span className="flex size-7 flex-none items-center justify-center text-lg">
                                    {emoji.emoji}
                                </span>
                                <span className="truncate text-xs text-fg-muted">{emoji.label}</span>
                            </>
                        ) : (
                            <span className="ml-1.5 truncate text-xs text-fg-faint">Select an emoji…</span>
                        )
                    }
                </Picker.ActiveEmoji>
                <Picker.SkinTone>
                    {({ skinToneVariations }) => (
                        <button
                            type="button"
                            onClick={cycleSkinTone}
                            aria-label="Change skin tone"
                            title="Change skin tone"
                            className="ml-auto flex size-7 flex-none items-center justify-center rounded-md text-lg hover:bg-surface-hover"
                        >
                            {skinToneVariations.find((v) => v.skinTone === skinTone)?.emoji}
                        </button>
                    )}
                </Picker.SkinTone>
            </div>
        </Picker.Root>
    );
};

export default EmojiPicker;
