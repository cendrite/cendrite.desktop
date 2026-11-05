import { wordlist } from '@scure/bip39/wordlists/english.js';

export const MAX_SUGGESTIONS = 5;

export function suggestWords(input: string): string[] {
    const prefix = input.trim().toLowerCase();
    if (prefix.length === 0) return [];

    const matches = wordlist.filter((word) => word.startsWith(prefix)).slice(0, MAX_SUGGESTIONS);
    return matches.length === 1 && matches[0] === prefix ? [] : matches;
}
