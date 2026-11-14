import { PublicKey } from '@signalapp/libsignal-client';
import { ILedgerIdentity } from '../Interfaces/ILedgerIdentity.js';
import { SignalProtocolStore } from './SignalProtocolStore.js';
import { IDeviceRepository } from '#electron/Application/Contracts/Repositories/IDeviceRepository';

/**
 * Operations are signed with the long-term libsignal identity key, inside the ciphertext, so members can
 * tell who authored a change. The server never sees these signatures.
 */
export class LedgerIdentity implements ILedgerIdentity {
    constructor(
        private readonly signalProtocolStore: SignalProtocolStore,
        private readonly deviceRepository: IDeviceRepository,
    ) { }

    public async sign(data: Buffer): Promise<Buffer> {
        const identityKey = await this.signalProtocolStore.getIdentityKey();
        return Buffer.from(identityKey.sign(data as Uint8Array<ArrayBuffer>));
    }

    public async publicKey(): Promise<Buffer> {
        const identityKey = await this.signalProtocolStore.getIdentityKey();
        return Buffer.from(identityKey.getPublicKey().serialize());
    }

    public async connectionId(): Promise<string> {
        const device = await this.deviceRepository.get();
        if (!device) throw new Error('No device is signed in');
        return device.connectionId;
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
