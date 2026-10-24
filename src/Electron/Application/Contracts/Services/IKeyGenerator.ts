import { EcPreKey } from '#electron/Domain/Encryption/EcPreKey';

export interface IKeyGenerator {
    generateKeyBundle(connectionId: string): Promise<void>;
    generatePreKeys(startId: number, count: number): EcPreKey[];
}
