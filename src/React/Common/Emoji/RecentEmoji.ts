export const MAX_RECENT_EMOJI = 24;

// Most recent first; re-using an emoji moves it to the front instead of duplicating it.
export function pushRecentEmoji(recent: readonly string[], emoji: string, max = MAX_RECENT_EMOJI): string[] {
    return [emoji, ...recent.filter((e) => e !== emoji)].slice(0, max);
}

export function parseRecentEmoji(value: unknown, max = MAX_RECENT_EMOJI): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((e): e is string => typeof e === 'string' && e.length > 0).slice(0, max);
}
