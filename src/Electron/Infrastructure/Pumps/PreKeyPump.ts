import { randomInt } from 'node:crypto';
import { IKeyStoreProvider } from '#electron/Application/Contracts/Providers/IKeyStoreProvider';
import { IKeyGenerator } from '#electron/Application/Contracts/Services/IKeyGenerator';
import { IProtocolStore } from '../Interfaces/IProtocolStore.js';
import { Pump } from './Pump.js';

export class PreKeyPump extends Pump {
    private static readonly MinPreKeys = 30;
    private static readonly BatchSize = 100;

    constructor(
        private readonly keyStoreProvider: IKeyStoreProvider,
        private readonly protocolStore: IProtocolStore,
        private readonly keyGenerator: IKeyGenerator,
    ) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            try {
                await this.replenish();
            } catch (error) {
                console.error('PreKeyPump: failed to replenish prekeys', error);
            }

            await this.sleep(60_000);
        }
    }

    private async replenish(): Promise<void> {
        const countResult = await this.keyStoreProvider.getPreKeyCount();
        if (!countResult.success) {
            console.error(`PreKeyPump: failed to get prekey count: ${countResult.errorMessage?.message}`);
            return;
        }

        if (countResult.data.keyCount >= PreKeyPump.MinPreKeys) return;

        const maxId = await this.protocolStore.getMaxPreKeyId();
        const preKeys = this.keyGenerator.generatePreKeys((maxId ?? randomInt(1, 1000000)) + 1, PreKeyPump.BatchSize);

        await this.protocolStore.storePreKeys(preKeys);

        const uploadResult = await this.keyStoreProvider.uploadPreKeys(
            preKeys.map((preKey) => ({
                keyId: preKey.id,
                publicKey: preKey.publicKey.toString('base64'),
            })),
        );

        if (!uploadResult.success) {
            console.error(`PreKeyPump: failed to upload prekeys: ${uploadResult.errorMessage?.message}`);
            return;
        }

        console.log(`PreKeyPump: uploaded ${preKeys.length} prekeys`);
    }
}
