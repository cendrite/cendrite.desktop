import { randomInt } from 'node:crypto';

const CONFIRM_WORD_COUNT = 3;

export function pickConfirmIndices(wordCount: number): number[] {
    const picked = new Set<number>();
    while (picked.size < CONFIRM_WORD_COUNT) {
        picked.add(randomInt(wordCount));
    }
    return [...picked].sort((a, b) => a - b);
}

export function confirmationsMatch(words: string[], confirmIndices: number[], confirmations: string[]): boolean {
    return (
        confirmations.length === confirmIndices.length &&
        confirmIndices.every((index, i) => confirmations[i]?.trim().toLowerCase() === words[index])
    );
}
