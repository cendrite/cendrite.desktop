import React, { useEffect, useMemo, useState } from 'react';
import { loadEmojiCatalog } from '@/React/Common/Emoji/EmojiData';
import {
    emojiWithSkinTone,
    findClosedShortcode,
    findExactShortcode,
    findShortcodeQuery,
    replaceRange,
    searchShortcodes,
    type ShortcodeEntry,
    type ShortcodeMatch,
    type ShortcodeQuery,
} from '@/React/Common/Emoji/Shortcodes';
import { useEmojiSettings } from '@/React/Context/Emoji/EmojiSettingsContext';

export type TextEdit = { text: string; caret: number };

export function useShortcodeAutocomplete(applyEdit: (edit: TextEdit) => void) {
    const { skinTone, recent, recordUsage } = useEmojiSettings();
    const [entries, setEntries] = useState<ShortcodeEntry[] | null>(null);
    const [query, setQuery] = useState<ShortcodeQuery | null>(null);
    const [dismissedStart, setDismissedStart] = useState<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // The catalog is only fetched the first time someone starts typing a shortcode.
    useEffect(() => {
        if (!query || entries) return;
        let cancelled = false;
        loadEmojiCatalog()
            .then((catalog) => !cancelled && setEntries(catalog.shortcodes))
            .catch((error) => console.error('Could not load emoji shortcodes', error));
        return () => {
            cancelled = true;
        };
    }, [query, entries]);

    const matches = useMemo<ShortcodeMatch[]>(() => {
        if (!query || !entries || query.start === dismissedStart) return [];
        return searchShortcodes(entries, query.query, recent);
    }, [query, entries, dismissedStart, recent]);

    useEffect(() => setActiveIndex(0), [query?.start, query?.query]);

    const updateQuery = (text: string, caret: number) => {
        const next = findShortcodeQuery(text, caret);
        setQuery(next);
        if (!next) setDismissedStart(null);
    };

    const insert = (text: string, start: number, end: number, entry: ShortcodeEntry) => {
        const emoji = emojiWithSkinTone(entry, skinTone);
        recordUsage(emoji);
        setQuery(null);
        applyEdit(replaceRange(text, start, end, emoji));
    };

    // Returns true when a just-closed ":code:" was swapped for its emoji.
    const handleChange = (text: string, caret: number): boolean => {
        const closed = findClosedShortcode(text, caret);
        const entry = closed && entries ? findExactShortcode(entries, closed.query) : undefined;
        if (closed && entry) {
            insert(text, closed.start, caret, entry);
            return true;
        }
        updateQuery(text, caret);
        return false;
    };

    const accept = (text: string, index: number) => {
        const match = matches[index];
        if (!query || !match) return;
        insert(text, query.start, query.start + query.query.length + 1, match.entry);
    };

    // Returns true when the key was consumed by the suggestion list.
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
        if (matches.length === 0) return false;

        switch (e.key) {
            case 'ArrowDown':
                setActiveIndex((i) => (i + 1) % matches.length);
                break;
            case 'ArrowUp':
                setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
                break;
            case 'Enter':
            case 'Tab':
                if (e.shiftKey) return false;
                accept(e.currentTarget.value, activeIndex);
                break;
            case 'Escape':
                setDismissedStart(query?.start ?? null);
                break;
            default:
                return false;
        }
        e.preventDefault();
        return true;
    };

    return { matches, activeIndex, setActiveIndex, handleChange, updateQuery, handleKeyDown, accept };
}
