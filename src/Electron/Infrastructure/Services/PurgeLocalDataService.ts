import { IPurgeLocalData } from '../../Application/Contracts/Services/IPurgeLocalData.js';
import { IChatStore } from '../../Application/Contracts/Repositories/IChatStore.js';
import { IDeviceRepository } from '../../Application/Contracts/Repositories/IDeviceRepository.js';
import { IFriendRepository } from '../../Application/Contracts/Repositories/IFriendRepository.js';
import { IUserRepository } from '../../Application/Contracts/Repositories/IUserRepository.js';
import { IProtocolStore } from '../Interfaces/IProtocolStore.js';
import { IRefreshTokenRepository } from '../Interfaces/IRefreshTokenRepository.js';
import { ISettingsRegistry } from '../../Application/Contracts/Services/ISettingsRegistry.js';

export class PurgeLocalDataService implements IPurgeLocalData {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly refreshTokenRepository: IRefreshTokenRepository,
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
        private readonly protocolStore: IProtocolStore,
        private readonly settingsRegistry: ISettingsRegistry,
    ) { }

    public async purgeLocalData(): Promise<void> {
        console.log('Purging local data...');

        await this.userRepository.delete();
        await this.deviceRepository.delete();
        await this.refreshTokenRepository.delete();
        await this.friendRepository.deleteAll();
        await this.chatStore.clear();
        await this.protocolStore.deleteAll();

        // Device-scoped settings (theme, window prefs) deliberately survive logout.
        for (const settings of this.settingsRegistry.accountScoped()) {
            await settings.delete();
        }

        console.log('Local data purged.');
    }
}
