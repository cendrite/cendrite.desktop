import { IKeyStoreProvider } from '#electron/Application/Contracts/Providers/IKeyStoreProvider';
import { IKeyGenerator } from '#electron/Application/Contracts/Services/IKeyGenerator';
import { EcPreKey } from '#electron/Domain/Encryption/EcPreKey';
import { IProtocolStore } from '../Interfaces/IProtocolStore.js';
import { Pump } from './Pump.js';
    
export class PreKeyPump extends Pump {
    constructor(
        private readonly kestoreProvider: IKeyStoreProvider,
        private readonly protocolStore: IProtocolStore,
        private readonly keyGenerator: IKeyGenerator) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            const prekeys: EcPreKey[] = [];
            const prekeyCount = await this.protocolStore.getPrekeyCount();
            if (prekeyCount < 30) {
                const keys = this.keyGenerator.generatePreKeys(prekeyCount + 1, 100);
                prekeys.push(...keys);
            }

            if (prekeys.length > 0) {
                const uploadResult = await this.kestoreProvider.uploadPreKeys(prekeys.map((preKey) => ({
                    keyId: preKey.id,
                    publicKey: preKey.publicKey.toString('base64'),
                })));

                if (uploadResult.success) {
                    await this.protocolStore.storePreKeys(prekeys);
                } else {
                    console.error(`Failed to upload prekeys: ${uploadResult.errorMessage}`);
                }
            }

            await this.sleep(60_000);
        }
    }
}
