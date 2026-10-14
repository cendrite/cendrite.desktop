import { randomInt } from 'node:crypto';
import { IdentityKeyPair, KEMKeyPair, KyberPreKeyRecord, PrivateKey } from '@signalapp/libsignal-client';
import { IKeyStoreProvider } from '#electron/Application/Contracts/Providers/IKeyStoreProvider';
import { IKeyGenerator } from '#electron/Application/Contracts/Services/IKeyGenerator';
import { IProtocolStore } from '../Interfaces/IProtocolStore.js';
import { IdentityKeys } from '#electron/Domain/Encryption/IdentityKeys';
import { EcPreKey } from '#electron/Domain/Encryption/EcPreKey';
import { SignedPreKey } from '#electron/Domain/Encryption/SignedPreKey';
import { KyberPreKey } from '#electron/Domain/Encryption/KyberPreKey';

export class KeyGenerator implements IKeyGenerator {
    private readonly keyStoreProvider: IKeyStoreProvider;
    private readonly ProtocolStore: IProtocolStore;

    constructor(keyStoreProvider: IKeyStoreProvider, protocolStore: IProtocolStore) {
        this.keyStoreProvider = keyStoreProvider;
        this.ProtocolStore = protocolStore;
    }

    public async generateKeyBundle(connectionId: string): Promise<void> {
        // Signal registration ids are 14-bit and must be non-zero.
        const registrationId = randomInt(1, 16381);

        const identityKeyPair = IdentityKeyPair.generate();

        const baseKeyId = this.generateNumberId();
        const signedPreKeyTimestamp = new Date();

        const signedPreKeyPrivate = PrivateKey.generate();
        const signedPreKeyPublic = signedPreKeyPrivate.getPublicKey();
        const signedPreKeySignature = identityKeyPair.privateKey.sign(signedPreKeyPublic.serialize());

        const ecPreKeys: EcPreKey[] = [];
        for (let i = 1; i <= 100; i++) {
            const preKeyPrivate = PrivateKey.generate();
            ecPreKeys.push(
                new EcPreKey(
                    baseKeyId + i,
                    Buffer.from(preKeyPrivate.serialize()),
                    Buffer.from(preKeyPrivate.getPublicKey().serialize()),
                ),
            );
        }

        // Last-resort Kyber prekey for PQXDH; the server hands it out with every bundle.
        const kyberKeyPair = KEMKeyPair.generate();
        const kyberPreKeySignature = identityKeyPair.privateKey.sign(kyberKeyPair.getPublicKey().serialize());
        const kyberPreKey = KyberPreKeyRecord.new(
            baseKeyId,
            signedPreKeyTimestamp.getTime(),
            kyberKeyPair,
            kyberPreKeySignature,
        );

        const uploadResult = await this.keyStoreProvider.createKeyBundle({
            accessKey: connectionId,
            identityKey: this.b64Encode(identityKeyPair.publicKey.serialize()),
            registrationId: registrationId,
            signedPreKeyId: baseKeyId,
            signedPreKeyPublic: this.b64Encode(signedPreKeyPublic.serialize()),
            signedPreKeySignature: this.b64Encode(signedPreKeySignature),
            signedPreKeyTimestamp: signedPreKeyTimestamp,
            preKeys: ecPreKeys.map((preKey) => ({
                keyId: preKey.id,
                publicKey: preKey.publicKey.toString('base64'),
            })),
            kyberPreKeyId: kyberPreKey.id(),
            kyberPreKeyPublic: this.b64Encode(kyberPreKey.publicKey().serialize()),
            kyberPreKeySignature: this.b64Encode(kyberPreKeySignature),
        });

        if (!uploadResult.success) {
            throw new Error('Failed to upload key bundle: ' + uploadResult.errorMessage?.message);
        }

        await this.ProtocolStore.createKeyBundle(
            new IdentityKeys(
                1,
                registrationId,
                Buffer.from(identityKeyPair.publicKey.serialize()),
                Buffer.from(identityKeyPair.privateKey.serialize()),
            ),
            new SignedPreKey(
                baseKeyId,
                Buffer.from(signedPreKeyPublic.serialize()),
                Buffer.from(signedPreKeyPrivate.serialize()),
                Buffer.from(signedPreKeySignature),
                signedPreKeyTimestamp,
            ),
            ecPreKeys,
            new KyberPreKey(kyberPreKey.id(), Buffer.from(kyberPreKey.serialize())),
        );
    }

    /**
     * Must be > 0: the keystore rejects a signed/Kyber prekey id of 0.
     */
    private generateNumberId(): number {
        return randomInt(1, 1000000);
    }

    private b64Encode(bytes: Uint8Array): string {
        return Buffer.from(bytes).toString('base64');
    }
}
