import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { IKeyStoreProvider } from '../../Contracts/Providers/IKeyStoreProvider.js';
import { ProtocolStore } from '../../../Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { IdentityKeys } from '../../../Domain/Encryption/IdentityKeys.js';
import { EcPreKey } from '../../../Domain/Encryption/EcPreKey.js';
import { SignedPreKey } from '../../../Domain/Encryption/SignedPreKey.js';

export interface IKeyService {
    generateKeyBundle(connectionId: string): Promise<void>;
}

export class KeyService implements IKeyService {
    private readonly keyStoreProvider: IKeyStoreProvider;
    private readonly ProtocolStore: ProtocolStore;

    constructor(keyStoreProvider: IKeyStoreProvider, protocolStore: ProtocolStore) {
        this.keyStoreProvider = keyStoreProvider;
        this.ProtocolStore = protocolStore;
    }

    public async generateKeyBundle(connectionId: string): Promise<void> {
        const registrationId = libsignal.KeyHelper.generateRegistrationId();

        const identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair();

        const baseKeyId = this.generateNumberId();
        const signedPrekey = await libsignal.KeyHelper.generateSignedPreKey(identityKeyPair, baseKeyId);

        const ecPrekeys: libsignal.PreKeyPairType[] = [];
        for (let i = 1; i <= 100; i++) {
            const preKey = await libsignal.KeyHelper.generatePreKey(baseKeyId + i);
            ecPrekeys.push(preKey);
        }

        await this.keyStoreProvider.createKeyBundle({
            accessKey: connectionId,
            identityKey: this.b64Encode(identityKeyPair.pubKey),
            registrationId: registrationId,
            signedPreKeyId: signedPrekey.keyId,
            signedPreKeyPublic: this.b64Encode(signedPrekey.keyPair.pubKey),
            signedPreKeySignature: this.b64Encode(signedPrekey.signature),
            signedPreKeyTimestamp: new Date(),
            preKeys: ecPrekeys.map((preKey) => ({
                keyId: preKey.keyId,
                publicKey: this.b64Encode(preKey.keyPair.pubKey),
            })),
        });

        await this.ProtocolStore.createKeyBundle(
            new IdentityKeys(
                1,
                registrationId,
                Buffer.from(identityKeyPair.pubKey),
                Buffer.from(identityKeyPair.privKey),
            ),
            new SignedPreKey(
                signedPrekey.keyId,
                Buffer.from(signedPrekey.keyPair.pubKey),
                Buffer.from(signedPrekey.keyPair.privKey),
                Buffer.from(signedPrekey.signature),
                new Date(),
            ),
            ecPrekeys.map(
                (preke) =>
                    new EcPreKey(preke.keyId, Buffer.from(preke.keyPair.privKey), Buffer.from(preke.keyPair.pubKey)),
            ),
        );
    }

    private generateNumberId(): number {
        return Math.floor(Math.random() * 1000000);
    }

    private b64Encode(buffer: ArrayBuffer): string {
        return Buffer.from(buffer).toString('base64');
    }
}
