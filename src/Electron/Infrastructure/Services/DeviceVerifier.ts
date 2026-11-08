import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { IDeviceVerifier } from '#electron/Application/Contracts/Services/IDeviceVerifier';
import { PinnedAccountKey } from '#electron/Domain/Encryption/PinnedAccountKey';
import { IProtocolStore } from '../Interfaces/IProtocolStore.js';
import { verifyDeviceChain } from '../Crypto/DeviceChain.js';

export class DeviceVerifier implements IDeviceVerifier {
    constructor(
        private readonly deviceProvider: IDeviceProvider,
        private readonly protocolStore: IProtocolStore,
    ) { }

    public async verify(connectionId: string, signalIdentityKey: string): Promise<boolean> {
        const chain = await this.deviceProvider.getDeviceChain(connectionId);
        if (!chain.success) {
            throw new Error(`Could not fetch the device chain for ${connectionId}: ${chain.errorMessage.message}`);
        }

        if (!chain.data.userTag) {
            throw new Error(`The device chain for ${connectionId} has no user tag`);
        }

        const pinned = await this.protocolStore.getPinnedAccountKey(chain.data.userTag);
        if (!verifyDeviceChain(chain.data, connectionId, signalIdentityKey, pinned?.accountPublicKey ?? null)) {
            return false;
        }

        if (pinned?.accountPublicKey !== chain.data.accountPublicKey) {
            await this.protocolStore.savePinnedAccountKey(new PinnedAccountKey(chain.data.userTag, chain.data.accountPublicKey, Date.now()));
        }

        return true;
    }
}
