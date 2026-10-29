import React from 'react';
import type { SkinTone } from 'frimousse';
import { emojiWithSkinTone, type ShortcodeMatch } from '@/React/Common/Emoji/Shortcodes';

export interface ShortcodeSuggestionsProps {
    matches: ShortcodeMatch[];
    activeIndex: number;
    skinTone: SkinTone;
    onHover: (index: number) => void;
    onSelect: (index: number) => void;
}

export const ShortcodeSuggestions: React.FC<ShortcodeSuggestionsProps> = ({
    matches,
    activeIndex,
    skinTone,
    onHover,
    onSelect,
}) => {
    if (matches.length === 0) return null;

    return (
        <ul
            role="listbox"
            aria-label="Emoji suggestions"
            className="absolute bottom-full left-0 mb-2 z-[1100] w-72 rounded-xl bg-overlay shadow-lg ring-1 ring-line p-1"
        >
            {matches.map(({ entry, shortcode }, index) => (
                <li
                    key={entry.emoji}
                    role="option"
                    aria-selected={index === activeIndex}
                    // Keep focus (and the caret) in the textarea while clicking a suggestion.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => onHover(index)}
                    onClick={() => onSelect(index)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm
                        ${index === activeIndex ? 'bg-surface-hover' : ''}`}
                >
                    <span className="text-xl leading-none">{emojiWithSkinTone(entry, skinTone)}</span>
                    <span className="text-fg">:{shortcode}:</span>
                    <span className="ml-auto truncate text-xs text-fg-faint">{entry.label}</span>
                </li>
            ))}
        </ul>
    );
};

export default ShortcodeSuggestions;
