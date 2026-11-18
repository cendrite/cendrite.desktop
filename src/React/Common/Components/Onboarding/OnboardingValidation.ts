export const USERNAME_MIN = 2;
export const USERNAME_MAX = 20;

const RESERVED_WORDS = ['cendrite', 'admin'];

const LOOK_ALIKES: Record<string, string[]> = {
    '0': ['o'],
    '1': ['i', 'l'],
    '3': ['e'],
    '4': ['a'],
    '5': ['s'],
    '7': ['t'],
};

export function containsReservedName(name: string): boolean {
    const lower = name.toLowerCase();
    const reads = (c: string, letter: string) => c === letter || (LOOK_ALIKES[c]?.includes(letter) ?? false);

    return RESERVED_WORDS.some((word) =>
        [...lower].some((_, start) => [...word].every((letter, i) => lower[start + i] !== undefined && reads(lower[start + i], letter))),
    );
}

export function validateUsername(username: string): string | null {
    const trimmed = username.trim();
    if (trimmed.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
    if (trimmed.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'Use only letters and digits.';
    if (containsReservedName(trimmed)) return 'That name is reserved. Choose another one.';
    return null;
}

export function findInvalidWords(words: string[], known: ReadonlySet<string>): number[] {
    return words.flatMap((word, i) => (known.has(word.trim().toLowerCase()) ? [] : [i]));
}
