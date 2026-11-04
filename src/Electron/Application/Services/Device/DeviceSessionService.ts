import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { UserContract } from '#shared/Models/UserContract';
import { Device } from '#electron/Domain/Entities/Device';
import { User } from '#electron/Domain/Aggregates/User';
import { UserConnectionId } from '#electron/Domain/Entities/UserConnectionId';
import { IDeviceRepository } from '../Contracts/Repositories/IDeviceRepository.js';
import { IUserRepository } from '../Contracts/Repositories/IUserRepository.js';
import { IUserProvider } from '../Contracts/Providers/IUserProvider.js';
import { ITokenManager } from '../Contracts/Services/ITokenManager.js';
import { IKeyGenerator } from '../Contracts/Services/IKeyGenerator.js';
import { ISignalManager } from '../Contracts/Services/ISignalManager.js';
import { IPump } from '../Contracts/Services/IPump.js';
import { IPurgeLocalData } from '../Contracts/Services/IPurgeLocalData.js';

export interface IDeviceSessionService {
    start(userId: string, device: Device): Promise<Result<UserContract>>;
}

export class DeviceSessionService implements IDeviceSessionService {
    constructor(
        private readonly deviceRepository: IDeviceRepository,
        private readonly userRepository: IUserRepository,
        private readonly userProvider: IUserProvider,
        private readonly tokenManager: ITokenManager,
        private readonly keyGenerator: IKeyGenerator,
        private readonly signalManager: ISignalManager,
        private readonly messagePump: IPump,
        private readonly deliveryStatusUpdatePump: IPump,
        private readonly preKeyPump: IPump,
        private readonly purgeLocalDataService: IPurgeLocalData,
    ) { }

    public async start(userId: string, device: Device): Promise<Result<UserContract>> {
        try {
            return Result.success(await this.establish(userId, device));
        } catch (error) {
            console.error('DeviceSessionService.start: setting up the device failed, rolling back', error);
            await this.rollback();
            return Result.fail<UserContract>(new ErrorMessage('Unauthorized', 'Setting up this device failed. Please try again.'));
        }
    }

    private async establish(userId: string, device: Device): Promise<UserContract> {
        await this.userRepository.delete();
        await this.deviceRepository.delete();
        await this.deviceRepository.create(device);

        await this.tokenManager.init(userId, device.id);
        await this.keyGenerator.generateKeyBundle(device.connectionId);
        await this.signalManager.connect();

        const profile = await this.userProvider.getUserProfile({ exclusiveConnectionId: device.connectionId });
        if (!profile.success || !profile.data) {
            throw new Error('Failed to retrieve the user profile');
        }

        const user = new User(
            profile.data.id,
            profile.data.username,
            profile.data.userTag,
            profile.data.avatarKey,
            profile.data.displayName,
        );
        user.connectionIds = profile.data.connectionIds.map((connectionId) => new UserConnectionId(connectionId, user));

        const savedUser = await this.userRepository.create(user);

        this.messagePump.start();
        this.deliveryStatusUpdatePump.start();
        this.preKeyPump.start();

        return new UserContract(
            savedUser.id,
            savedUser.username,
            savedUser.userTag,
            device.id,
            device.connectionId,
            savedUser.connectionIds.map((connection) => connection.connectionId),
            savedUser.avatarKey,
            savedUser.displayName,
        );
    }

    private async rollback(): Promise<void> {
        try {
            await this.signalManager.disconnect();
            this.tokenManager.disableAndClear();
            await this.purgeLocalDataService.purgeLocalData();
        } catch (error) {
            console.error('DeviceSessionService.rollback: cleanup failed', error);
        }
    }
}
