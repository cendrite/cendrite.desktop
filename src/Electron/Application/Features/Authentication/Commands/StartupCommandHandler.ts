import { Result } from '#shared/Result/Result';
import { DeviceRevokedError, ITokenManager } from '#electron/Application/Contracts/Services/ITokenManager';
import { IPurgeLocalData } from '#electron/Application/Contracts/Services/IPurgeLocalData';
import { ISignalManager } from '#electron/Application/Contracts/Services/ISignalManager';
import { UserContract } from '#shared/Models/UserContract';
import { IDeviceRepository } from '#electron/Application/Contracts/Repositories/IDeviceRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { StartupCommand, StartupDto } from '#shared/Authentication/Startup';

export class StartupCommandHandler implements Handler<StartupCommand, StartupDto> {
    constructor(
        private readonly deviceRepository: IDeviceRepository,
        private readonly userRepository: IUserRepository,
        private readonly tokenManager: ITokenManager,
        private readonly signalManager: ISignalManager,
        private readonly messagePump: IPump,
        private readonly deliveryStatusUpdatePump: IPump,
        private readonly preKeyPump: IPump,
        private readonly purgeLocalDataService: IPurgeLocalData,
    ) { }

    public async handle(_cmd: StartupCommand): Promise<Result<StartupDto>> {
        const device = await this.deviceRepository.get();
        if (!device) {
            return Result.success({
                user: null,
            });
        }

        const user = await this.userRepository.get(true);
        if (!user) {
            throw new Error('THIS IS A CRITICAL STATE. DEVICE EXISTS BUT USER DOES NOT. THIS SHOULD NEVER HAPPEN.');
        }

        const returnUsr = new UserContract(
            user.id,
            user.username,
            user.userTag,
            device.id,
            device.connectionId,
            user.connectionIds.map((c) => c.connectionId),
            user.avatarKey,
            user.displayName,
        );

        try {
            await this.tokenManager.init(returnUsr.id, returnUsr.deviceId);
        } catch (error) {
            if (!(error instanceof DeviceRevokedError)) throw error;

            console.warn('StartupCommandHandler.handle: Device has been revoked, purging local data');
            this.tokenManager.disableAndClear();
            await this.purgeLocalDataService.purgeLocalData();

            return Result.success({
                user: null,
            });
        }
        await this.signalManager.connect();
        this.messagePump.start();
        this.deliveryStatusUpdatePump.start();
        this.preKeyPump.start();

        return Result.success({
            user: returnUsr,
        });
    }
}
