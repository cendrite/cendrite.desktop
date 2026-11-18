export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const RESERVED_WORDS = ['cendrite', 'admin'];

const CONFUSABLES: Record<string, string> = {
    а: 'a', е: 'e', о: 'o', с: 'c', р: 'p', х: 'x', у: 'y', і: 'i', ј: 'j', ѕ: 's', ԁ: 'd', ӏ: 'l', ո: 'n', ⅰ: 'i', ı: 'i',
};

const LOOK_ALIKES: Record<string, string[]> = {
    '0': ['o'],
    '1': ['i', 'l'],
    '3': ['e'],
    '4': ['a'],
    '5': ['s'],
    '7': ['t'],
    '@': ['a'],
    $: ['s'],
    '!': ['i'],
};

function skeleton(name: string): string {
    return [...name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()]
        .map((c) => CONFUSABLES[c] ?? c)
        .filter((c) => /[a-z0-9]/.test(c) || c in LOOK_ALIKES)
        .join('');
}

export function containsReservedName(name: string): boolean {
    const chars = [...skeleton(name)];
    const reads = (c: string, letter: string) => c === letter || (LOOK_ALIKES[c]?.includes(letter) ?? false);

    return RESERVED_WORDS.some((word) =>
        chars.some((_, start) => [...word].every((letter, i) => chars[start + i] !== undefined && reads(chars[start + i], letter))),
    );
}

export function validateUsername(username: string): string | null {
    const trimmed = username.trim();
    if (trimmed.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
    if (trimmed.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
    if (containsReservedName(trimmed)) return 'That name is reserved. Choose another one.';
    return null;
}

export function findInvalidWords(words: string[], known: ReadonlySet<string>): number[] {
    return words.flatMap((word, i) => (known.has(word.trim().toLowerCase()) ? [] : [i]));
}
