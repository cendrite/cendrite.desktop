export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export function validateUsername(username: string): string | null {
    const trimmed = username.trim();
    if (trimmed.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
    if (trimmed.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
    return null;
}

export function findInvalidWords(words: string[], known: ReadonlySet<string>): number[] {
    return words.flatMap((word, i) => (known.has(word.trim().toLowerCase()) ? [] : [i]));
}
