import { IPurgeLocalData } from '#electron/Application/Contracts/Services/IPurgeLocalData';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { ILedgerLogRepository } from '#electron/Application/Contracts/Repositories/ILedgerLogRepository';
import { IPrivateTokenRepository } from '#electron/Application/Contracts/Repositories/IPrivateTokenRepository';
import { IDeviceRepository } from '#electron/Application/Contracts/Repositories/IDeviceRepository';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';
import { IProtocolStore } from '../Interfaces/IProtocolStore.js';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { ISettingsRegistry } from '#electron/Application/Contracts/Services/ISettingsRegistry';

export class PurgeLocalDataService implements IPurgeLocalData {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
        private readonly protocolStore: IProtocolStore,
        private readonly settingsRegistry: ISettingsRegistry,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly ledgerLogRepository: ILedgerLogRepository,
        private readonly privateTokenRepository: IPrivateTokenRepository,
        private readonly eventRepository: IOutboxRepository,
        private readonly mediaStore: IMediaStore,
    ) { }

    public async purgeLocalData(): Promise<void> {
        console.log('Purging local data...');

        await this.userRepository.delete();
        await this.deviceRepository.delete();
        await this.friendRepository.deleteAll();
        await this.chatStore.clear();
        await this.protocolStore.deleteAll();
        await this.ledgerLogRepository.deleteAll();
        await this.groupRepository.deleteAll();
        await this.groupKeyRepository.deleteAll();
        await this.privateTokenRepository.deleteAll();
        await this.eventRepository.deleteAll();
        await this.mediaStore.clear();

        // Device-scoped settings (theme, window prefs) deliberately survive logout.
        for (const settings of this.settingsRegistry.accountScoped()) {
            await settings.delete();
        }

        console.log('Local data purged.');
    }
}
