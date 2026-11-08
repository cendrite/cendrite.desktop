import { EcPreKey } from '#electron/Domain/Encryption/EcPreKey';

export interface SignalIdentity {
    publicKey: string;
    privateKey: string;
}

export interface IKeyGenerator {
    generateIdentity(): SignalIdentity;
    generateKeyBundle(connectionId: string, identity: SignalIdentity): Promise<void>;
    generatePreKeys(startId: number, count: number): EcPreKey[];
}
