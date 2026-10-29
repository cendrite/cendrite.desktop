import type { SkinTone } from 'frimousse';

export type ShortcodeEntry = {
    emoji: string;
    label: string;
    shortcodes: string[];
    skins?: Partial<Record<Exclude<SkinTone, 'none'>, string>>;
};

export type ShortcodeMatch = {
    entry: ShortcodeEntry;
    shortcode: string;
};

export type ShortcodeQuery = {
    start: number;
    query: string;
};

export const MIN_SHORTCODE_QUERY = 2;
export const MAX_SHORTCODE_SUGGESTIONS = 8;

const SHORTCODE_CHARS = '[a-z0-9_+\\-]';
const OPEN_QUERY = new RegExp(`(?:^|\\s):(${SHORTCODE_CHARS}{${MIN_SHORTCODE_QUERY},})$`, 'i');
const CLOSED_QUERY = new RegExp(`(?:^|\\s):(${SHORTCODE_CHARS}+):$`, 'i');

export function findShortcodeQuery(text: string, caret: number): ShortcodeQuery | null {
    const match = OPEN_QUERY.exec(text.slice(0, caret));
    if (!match) return null;
    return { start: caret - match[1].length - 1, query: match[1].toLowerCase() };
}

export function findClosedShortcode(text: string, caret: number): ShortcodeQuery | null {
    const match = CLOSED_QUERY.exec(text.slice(0, caret));
    if (!match) return null;
    return { start: caret - match[1].length - 2, query: match[1].toLowerCase() };
}

export function replaceRange(text: string, start: number, end: number, insert: string) {
    return { text: text.slice(0, start) + insert + text.slice(end), caret: start + insert.length };
}

export function emojiWithSkinTone(entry: ShortcodeEntry, skinTones: Readonly<Record<string, string>>): string {
    return skinTones[entry.emoji] ?? entry.emoji;
}

export function findExactShortcode(entries: readonly ShortcodeEntry[], code: string): ShortcodeEntry | undefined {
    return entries.find((e) => e.shortcodes.includes(code));
}

export function searchShortcodes(
    entries: readonly ShortcodeEntry[],
    query: string,
    recent: readonly string[] = [],
    limit = MAX_SHORTCODE_SUGGESTIONS,
): ShortcodeMatch[] {
    const q = query.toLowerCase();
    const recentRank = new Map<string, number>();
    recent.forEach((emoji, i) => recentRank.set(emoji, i));

    const scored: { match: ShortcodeMatch; tier: number; recency: number; order: number }[] = [];
    entries.forEach((entry, order) => {
        const prefix = entry.shortcodes.find((s) => s.startsWith(q));
        const shortcode = prefix ?? entry.shortcodes.find((s) => s.includes(q));
        if (!shortcode) return;

        const variants = [entry.emoji, ...Object.values(entry.skins ?? {})];
        const recency = Math.min(...variants.map((v) => recentRank.get(v) ?? Infinity));
        scored.push({ match: { entry, shortcode }, tier: prefix ? 0 : 1, recency, order });
    });

    return scored
        .sort(
            (a, b) =>
                a.tier - b.tier ||
                a.recency - b.recency ||
                a.match.shortcode.length - b.match.shortcode.length ||
                a.order - b.order,
        )
        .slice(0, limit)
        .map((s) => s.match);
}
