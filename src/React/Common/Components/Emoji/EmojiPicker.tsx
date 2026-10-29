import React, { useState } from 'react';
import { EmojiPicker as Picker, type EmojiPickerListComponents, type SkinTone } from 'frimousse';
import { resolveEmojiData } from '@/React/Common/Emoji/EmojiData';

const SKIN_TONE_STORAGE_KEY = 'cypherly/emoji-skin-tone';
const SKIN_TONES: SkinTone[] = ['none', 'light', 'medium-light', 'medium', 'medium-dark', 'dark'];

function readSkinTone(): SkinTone {
    try {
        const stored = localStorage.getItem(SKIN_TONE_STORAGE_KEY);
        return SKIN_TONES.find((t) => t === stored) ?? 'none';
    } catch {
        return 'none';
    }
}

function storeSkinTone(skinTone: SkinTone): void {
    try {
        localStorage.setItem(SKIN_TONE_STORAGE_KEY, skinTone);
    } catch {
        // Only a convenience; the picker still works without persistence.
    }
}

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
    const [skinTone, setSkinTone] = useState<SkinTone>(readSkinTone);

    const cycleSkinTone = () => {
        const next = SKIN_TONES[(SKIN_TONES.indexOf(skinTone) + 1) % SKIN_TONES.length];
        setSkinTone(next);
        storeSkinTone(next);
    };

    return (
        <Picker.Root
            className={`isolate flex h-[368px] w-fit flex-col bg-overlay ${className ?? ''}`}
            columns={9}
            skinTone={skinTone}
            resolveEmojiData={resolveEmojiData}
            onEmojiSelect={({ emoji }) => onEmojiSelect(emoji)}
        >
            <Picker.Search
                autoFocus
                placeholder="Search emoji"
                className="z-10 mx-2 mt-2 appearance-none rounded-md bg-field px-2.5 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none"
            />
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
