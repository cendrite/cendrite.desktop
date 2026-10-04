import { PublicKey } from '@signalapp/libsignal-client';
import { ILedgerIdentity } from '../Interfaces/ILedgerIdentity.js';
import { SignalProtocolStore } from './SignalProtocolStore.js';

/**
 * Operations are signed with the long-term libsignal identity key, inside the ciphertext, so members can
 * tell who authored a change. The server never sees these signatures.
 */
export class LedgerIdentity implements ILedgerIdentity {
    constructor(private readonly signalProtocolStore: SignalProtocolStore) { }

    public async sign(data: Buffer): Promise<Buffer> {
        const identityKey = await this.signalProtocolStore.getIdentityKey();
        return Buffer.from(identityKey.sign(data as Uint8Array<ArrayBuffer>));
    }

    public async publicKey(): Promise<Buffer> {
        const identityKey = await this.signalProtocolStore.getIdentityKey();
        return Buffer.from(identityKey.getPublicKey().serialize());
    }

    public verify(identityKey: Buffer, data: Buffer, signature: Buffer): boolean {
        try {
            return PublicKey.deserialize(identityKey as Uint8Array<ArrayBuffer>).verify(
                data as Uint8Array<ArrayBuffer>,
                signature as Uint8Array<ArrayBuffer>,
            );
        } catch {
            return false;
        }
    }
}
