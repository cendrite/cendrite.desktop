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
import { ILedgerWriter } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { DeviceLeftOperation } from '#electron/Domain/Protocol/LedgerOperation';

const LEAVE_GROUPS_TIMEOUT_MS = 5_000;

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
        private readonly ledgerWriter: ILedgerWriter,
    ) { }

    public async purgeLocalData(): Promise<void> {
        console.log('Purging local data...');

        await this.leaveGroups();

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

    private async leaveGroups(): Promise<void> {
        try {
            const groupIds = await this.groupRepository.getIds();
            if (groupIds.length === 0) return;

            const device = await this.deviceRepository.get();
            if (device === null) return;

            const { userTag } = await this.userRepository.get(true);
            let timer: NodeJS.Timeout | undefined;
            const timeout = new Promise((resolve) => {
                timer = setTimeout(resolve, LEAVE_GROUPS_TIMEOUT_MS);
            });

            await Promise.race([
                Promise.allSettled(groupIds.map((groupId) => this.leaveGroup(groupId, userTag, device.connectionId))),
                timeout,
            ]);
            clearTimeout(timer);
        } catch (error) {
            console.error('PurgeLocalDataService: could not remove this device from its groups', error);
        }
    }

    private async leaveGroup(groupId: string, userTag: string, connectionId: string): Promise<void> {
        const group = await this.groupRepository.get(groupId);
        if (group?.lifecycle !== GroupLifecycle.Active) return;

        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey || writeKey.isInvite) return;

        const operation = new DeviceLeftOperation(userTag, writeKey.publicKey.toString('base64'), connectionId);
        const result = await this.ledgerWriter.appendDeviceLeft(groupId, operation);

        if (!result.success) console.warn(`PurgeLocalDataService: could not leave group ${groupId}: ${result.errorMessage.message}`);
    }
}
