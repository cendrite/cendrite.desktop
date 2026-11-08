import { createHash, randomInt } from 'node:crypto';

const GROUPS = 4;
const GROUP_BYTES = 5;

export function fingerprintOf(devicePublicKey: string, signalIdentityKey: string): string {
    const hash = createHash('sha256')
        .update(Buffer.from(devicePublicKey, 'base64'))
        .update(Buffer.from(signalIdentityKey, 'base64'))
        .digest();
    return Array.from({ length: GROUPS }, (_, i) => {
        const chunk = hash.readUIntBE(i * GROUP_BYTES, GROUP_BYTES);
        return String(chunk % 100000).padStart(5, '0');
    }).join(' ');
}

export function decoyFingerprint(): string {
    return Array.from({ length: GROUPS }, () => String(randomInt(100000)).padStart(5, '0')).join(' ');
}

export function shuffled<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
