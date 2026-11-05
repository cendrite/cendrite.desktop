import { createHash } from 'node:crypto';

const BATCH_SIZE = 20_000;

export function leadingZeroBits(hash: Uint8Array): number {
    let count = 0;
    for (const byte of hash) {
        if (byte === 0) {
            count += 8;
            continue;
        }
        return count + Math.clz32(byte) - 24;
    }
    return count;
}

export function isProofOfWorkSolved(challenge: Uint8Array, nonce: bigint, difficulty: number): boolean {
    return leadingZeroBits(hash(input(challenge, nonce))) >= difficulty;
}

export async function solveProofOfWork(challenge: Uint8Array, difficulty: number): Promise<bigint> {
    const buffer = input(challenge, 0n);

    for (let nonce = 0n; ; ) {
        for (let i = 0; i < BATCH_SIZE; i++, nonce++) {
            buffer.writeBigUInt64BE(nonce, challenge.length);
            if (leadingZeroBits(hash(buffer)) >= difficulty) return nonce;
        }
        await new Promise((resolve) => setImmediate(resolve));
    }
}

function input(challenge: Uint8Array, nonce: bigint): Buffer {
    const buffer = Buffer.alloc(challenge.length + 8);
    buffer.set(challenge, 0);
    buffer.writeBigUInt64BE(nonce, challenge.length);
    return buffer;
}

function hash(data: Uint8Array): Buffer {
    return createHash('sha256').update(data).digest();
}
